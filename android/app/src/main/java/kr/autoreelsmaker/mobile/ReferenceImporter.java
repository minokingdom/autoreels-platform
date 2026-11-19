package kr.autoreelsmaker.mobile;

import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.media.MediaCodec;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.ByteBuffer;
import java.util.Comparator;
import java.util.List;
import org.schabi.newpipe.extractor.ServiceList;
import org.schabi.newpipe.extractor.stream.*;

final class ReferenceImporter {
    private static final long LIMIT = 250L*1024*1024;
    interface Progress { void show(String message); }
    private final Progress progress;
    private long downloaded;

    ReferenceImporter(Progress progress) { this.progress=progress; }

    File load(String id, File dir, java.util.function.Consumer<String> title) throws Exception {
        if (!id.matches("[A-Za-z0-9_-]{11}")) throw new IOException("쇼츠 링크를 확인해 주세요.");
        StreamExtractor source = ServiceList.YouTube.getStreamExtractor("https://www.youtube.com/watch?v="+id);
        source.fetchPage();
        title.accept(source.getName());
        if (source.getLength() < 1 || source.getLength() > 90) throw new IOException("90초 이내의 공개 영상을 선택해 주세요.");
        progress.show("휴대폰으로 영상을 받고 있어요.");
        VideoStream combined = chooseVideo(source.getVideoStreams());
        if (combined != null) return get(combined, dir);
        VideoStream picture = chooseVideo(source.getVideoOnlyStreams());
        AudioStream sound = source.getAudioStreams().stream().filter(s -> s.isUrl() && s.getFormat()==org.schabi.newpipe.extractor.MediaFormat.M4A)
                .findFirst().orElse(null);
        if (picture==null || sound==null) throw new IOException("이 쇼츠에서 재생 가능한 영상과 음성을 찾지 못했어요.");
        File video=get(picture,dir), audio=null, result=null;
        try {
            audio=get(sound,dir);
            progress.show("영상과 소리를 맞추고 있어요.");
            result=File.createTempFile("clip-", ".mp4",dir);
            mux(video,audio,result);
            return result;
        } catch(Exception e) {if(result!=null)result.delete();throw e;}
        finally {video.delete();if(audio!=null)audio.delete();}
    }

    private VideoStream chooseVideo(List<VideoStream> options) {
        return options.stream().filter(s->s.isUrl() && s.getFormat()==org.schabi.newpipe.extractor.MediaFormat.MPEG_4)
                .min(Comparator.comparingInt(s->Math.abs(Math.min(s.getHeight(),s.getWidth())-720))).orElse(null);
    }

    private File get(Stream stream, File dir) throws Exception {
        URI uri=URI.create(stream.getContent());
        if (!"https".equals(uri.getScheme()) || uri.getHost()==null || !uri.getHost().endsWith(".googlevideo.com")) throw new IOException("동영상 주소를 확인하지 못했어요.");
        File file=File.createTempFile("clip-", ".mp4",dir);
        HttpURLConnection c=RequestClient.connect(uri.toString());
        try {
            int code=c.getResponseCode();
            if(code!=200 && code!=206) throw new IOException("유튜브에서 이 영상의 다운로드를 허용하지 않았어요.");
            long size=c.getContentLengthLong();
            if (size>LIMIT-downloaded)throw new IOException("250MB 이내의 영상을 골라 주세요.");
            long written=0,reportedAt=0;
            try(InputStream in=c.getInputStream(); OutputStream out=new BufferedOutputStream(new FileOutputStream(file))) {
                byte[] bytes=new byte[65536];int n;
                while ((n=in.read(bytes))!=-1) {
                    if(Thread.currentThread().isInterrupted())throw new InterruptedIOException();
                    downloaded+=n;written+=n;
                    if(downloaded>LIMIT)throw new IOException("250MB 이내의 영상을 골라 주세요.");
                    out.write(bytes,0,n);
                    long now=android.os.SystemClock.elapsedRealtime();
                    if(now-reportedAt>2500){progress.show("휴대폰으로 영상을 받고 있어요 · "+(downloaded/1024/1024)+"MB");reportedAt=now;}
                }
            }
            String range=c.getHeaderField("Content-Range");
            if(written==0 || size>=0 && size!=written || range!=null && !range.equals("bytes 0-"+(written-1)+"/"+written))throw new IOException("영상을 끝까지 받지 못했어요.");
            return file;
        } catch(Exception e){file.delete();throw e;}finally{c.disconnect();}
    }

    private static int track(MediaExtractor e,String prefix) throws IOException {
        for(int i=0;i<e.getTrackCount();i++) if(e.getTrackFormat(i).getString(MediaFormat.KEY_MIME).startsWith(prefix)) return i;
        throw new IOException("영상 트랙을 읽지 못했어요.");
    }
    private static void mux(File video,File audio,File output) throws IOException {
        MediaExtractor v=new MediaExtractor(),a=new MediaExtractor();
        MediaMuxer mux=null;
        try {
            v.setDataSource(video.toString());a.setDataSource(audio.toString());
            int vi=track(v,"video/"),ai=track(a,"audio/");
            mux=new MediaMuxer(output.toString(),MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            int vt=mux.addTrack(v.getTrackFormat(vi)),at=mux.addTrack(a.getTrackFormat(ai));
            v.selectTrack(vi);a.selectTrack(ai);mux.start();
            ByteBuffer buffer=ByteBuffer.allocateDirect(8*1024*1024);
            MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();
            while(v.getSampleTime()>=0 || a.getSampleTime()>=0){
                if(Thread.currentThread().isInterrupted())throw new InterruptedIOException();
                boolean useVideo=a.getSampleTime()<0 || v.getSampleTime()>=0 && v.getSampleTime()<=a.getSampleTime();
                MediaExtractor e=useVideo?v:a;buffer.clear();int n=e.readSampleData(buffer,0);if(n<0)throw new IOException("미디어 샘플을 읽지 못했어요.");
                info.set(0,n,e.getSampleTime(),(e.getSampleFlags()&MediaExtractor.SAMPLE_FLAG_SYNC)!=0?MediaCodec.BUFFER_FLAG_KEY_FRAME:0);
                mux.writeSampleData(useVideo?vt:at,buffer,info);e.advance();
            }
            mux.stop();
        } finally {v.release();a.release();if(mux!=null)mux.release();}
    }
}
