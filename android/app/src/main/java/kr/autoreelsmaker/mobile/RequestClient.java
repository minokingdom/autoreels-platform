package kr.autoreelsmaker.mobile;

import org.schabi.newpipe.extractor.downloader.Downloader;
import org.schabi.newpipe.extractor.downloader.Request;
import org.schabi.newpipe.extractor.downloader.Response;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.*;
import java.util.Map;
import java.util.List;
import java.util.zip.GZIPInputStream;

final class RequestClient extends Downloader {
    static HttpURLConnection connect(String address) throws IOException {
        URL url = new URL(address);
        if (!"https".equals(url.getProtocol())) throw new IOException("HTTPS 영상 주소가 필요해요.");
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(25000);
        return c;
    }

    @Override public Response execute(Request req) throws IOException {
        HttpURLConnection c = connect(req.url());
        try {
            c.setRequestMethod(req.httpMethod());
            for (Map.Entry<String,List<String>> entry : req.headers().entrySet()) {
                for (String value : entry.getValue()) c.addRequestProperty(entry.getKey(), value);
            }
            if (req.dataToSend() != null) {
                c.setDoOutput(true);
                try (OutputStream out = c.getOutputStream()) { out.write(req.dataToSend()); }
            }
            int code = c.getResponseCode();
            InputStream raw = code >= 400 ? c.getErrorStream() : c.getInputStream();
            ByteArrayOutputStream body = new ByteArrayOutputStream();
            if (raw != null) try (InputStream in = "gzip".equalsIgnoreCase(c.getContentEncoding()) ? new GZIPInputStream(raw) : raw) {
                byte[] chunk = new byte[32768]; int n;
                while ((n = in.read(chunk)) != -1) {
                    if (Thread.currentThread().isInterrupted() || body.size()+n > 20*1024*1024) throw new IOException();
                    body.write(chunk,0,n);
                }
            }
            return new Response(code,c.getResponseMessage(),c.getHeaderFields(),body.toString("UTF-8"),c.getURL().toString());
        } finally { c.disconnect(); }
    }
}
