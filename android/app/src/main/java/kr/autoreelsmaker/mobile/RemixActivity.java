package kr.autoreelsmaker.mobile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.*;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import org.schabi.newpipe.extractor.NewPipe;
import java.io.File;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.*;

public final class RemixActivity extends Activity {
    private static final String HOST="autoreelsmaker.kr", PATH="/assets/remix/index.html";
    private static final int PICK=8;
    private WebView web;
    private ExportFile exporter;
    private ValueCallback<Uri[]> picker;
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private Future<?> job;
    private File folder;
    private String active="";
    private int generation;
    private static boolean isStudio(Uri u) {
        return u!=null && "https".equals(u.getScheme()) && HOST.equals(u.getHost()) && u.getUserInfo()==null && (u.getPort()==-1 || u.getPort()==443);
    }
    private boolean remixOpen(){
        if(web==null || web.getUrl()==null)return false;
        Uri u=Uri.parse(web.getUrl());return isStudio(u)&&PATH.equals(u.getPath());
    }
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        folder=new File(new File(getCacheDir(),"reference"),UUID.randomUUID().toString());
        folder.mkdirs();
        NewPipe.init(new RequestClient());
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0);
        web=new WebView(this);
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString()+" AutoReelsMakerAndroid/1");
        web.setBackgroundColor(0xff131418);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest r){
                if(!r.isForMainFrame())return false;
                Uri u=r.getUrl();if(isStudio(u))return false;
                if("https".equals(u.getScheme()) && r.hasGesture())try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(android.content.ActivityNotFoundException ignored){}
                return true;
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){cancel();if(exporter!=null)exporter.close("cancel");super.onPageStarted(view,url,icon);}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> cb,FileChooserParams params){
                cancel();picker=cb;
                String[] types=params.getAcceptTypes();
                if(types.length==1 && "video/x-autoreels-youtube".equals(types[0])){
                    if(!remixOpen()){finishPick(null);return true;}
                    importVideo(generation);return true;
                }
                try{
                    Intent choose=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                    if(types.length>0 && !types[0].isEmpty())choose.putExtra(Intent.EXTRA_MIME_TYPES,types);
                    choose.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                    startActivityForResult(choose,PICK);
                }catch(android.content.ActivityNotFoundException ex){finishPick(null);}
                return true;
            }
        });
        exporter=new ExportFile(this,web);
        setContentView(web);
        web.loadUrl("https://"+HOST+PATH);
    }
    private void importVideo(int version){
        web.evaluateJavascript("(()=>{const e=document.getElementById('androidReference');return e?[e.dataset.videoId,e.dataset.requestId]:null})()", data->{
            if(version!=generation||!remixOpen())return;
            try{
                JSONArray args=new JSONArray(data);
                String video=args.getString(0),key=args.getString(1);
                if(!video.matches("[A-Za-z0-9_-]{11}")||!key.matches("[0-9a-f-]{36}"))throw new IllegalArgumentException();
                active=key;
                job=io.submit(()->{
                    try {
                        File[] previous=folder.listFiles();
                        if(previous!=null)for(File old:previous)old.delete();
                        File file=new ReferenceImporter(msg->runOnUiThread(()->notifyPage(version,"progress",msg))).load(video,folder,title->runOnUiThread(()->notifyPage(version,"title",title)));
                        runOnUiThread(()->{
                            if(version!=generation||!remixOpen()){file.delete();return;}
                            finishPick(new Uri[]{FileProvider.getUriForFile(this,getPackageName()+".reference",file)});
                        });
                    }catch(Exception ex){
                        if((getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0)android.util.Log.w("ARImport","Import failed: "+ex.getClass().getSimpleName()+" / "+(ex.getCause()==null?"":ex.getCause().getClass().getSimpleName()));
                        runOnUiThread(()->{
                            if(version!=generation)return;
                            String msg=ex.getMessage();
                            notifyPage(version,"error",msg!=null && msg.matches("[가-힣].{0,100}")?msg:"이 유튜브 영상을 읽지 못했어요. 공개 쇼츠인지 확인하고 다시 시도해 주세요.");
                            finishPick(null);
                        });
                    }
                });
            }catch(Exception ex){finishPick(null);}
        });
    }
    private void notifyPage(int version,String kind,String msg){
        if(version!=generation||!remixOpen())return;
        web.evaluateJavascript("dispatchEvent(new CustomEvent('ar-native-reference',{detail:{id:"+JSONObject.quote(active)+",kind:"+JSONObject.quote(kind)+",message:"+JSONObject.quote(msg)+"}}))",null);
    }
    private void cancel(){generation++;active="";if(job!=null){job.cancel(true);job=null;}finishPick(null);}
    private void finishPick(Uri[] uris){ValueCallback<Uri[]> cb=picker;picker=null;if(cb!=null)cb.onReceiveValue(uris);}
    @Override protected void onActivityResult(int req,int result,Intent data){
        super.onActivityResult(req,result,data);if(req==ExportFile.CREATE){exporter.selected(result,data);return;}if(req!=PICK)return;
        ArrayList<Uri> files=new ArrayList<>();
        if(result==RESULT_OK&&data!=null){
            if(data.getClipData()!=null){for(int i=0;i<data.getClipData().getItemCount();i++)files.add(data.getClipData().getItemAt(i).getUri());}
            else if(data.getData()!=null)files.add(data.getData());
        }
        files.removeIf(u->u==null||!"content".equals(u.getScheme())||(getPackageName()+".reference").equals(u.getAuthority()));
        finishPick(files.isEmpty()?null:files.toArray(new Uri[0]));
    }
    @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
    @Override public void onDestroy(){
        cancel();exporter.close("cancel");io.shutdownNow();File[] files=folder.listFiles();if(files!=null)for(File file:files)file.delete();folder.delete();
        ((ViewGroup)web.getParent()).removeView(web);web.destroy();web=null;super.onDestroy();
    }
}
