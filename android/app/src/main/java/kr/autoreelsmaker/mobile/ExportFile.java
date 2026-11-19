package kr.autoreelsmaker.mobile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.WebView;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Collections;

final class ExportFile {
    static final int CREATE = 19;
    private final Activity host;
    private JavaScriptReplyProxy reply;
    private OutputStream output;
    private String key;
    private long remaining;

    ExportFile(Activity host,WebView web) {
        this.host=host;
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))return;
        WebViewCompat.addWebMessageListener(web,"AutoReelsExport",Collections.singleton("https://autoreelsmaker.kr"),
          (view,message,origin,main,proxy)->{
            if(!main || view.getUrl()==null || !"/assets/remix/index.html".equals(Uri.parse(view.getUrl()).getPath()))return;
            try{
                JSONObject data=new JSONObject(message.getData());
                String id=data.getString("id"),op=data.getString("op");
                if("begin".equals(op)){
                    if(key!=null || !id.matches("[0-9a-f-]{36}")) { proxy.postMessage("busy");return;}
                    boolean mp4="mp4".equals(data.getString("format"));
                    long length=data.getLong("size");
                    if(length<=0 || length>1024L*1024*1024){proxy.postMessage("error");return;}
                    key=id;reply=proxy;remaining=length;
                    Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mp4?"video/mp4":"application/zip").putExtra(Intent.EXTRA_TITLE,mp4?"오토릴스메이커-재구성.mp4":"오토릴스메이커-Hypit.zip");
                    host.startActivityForResult(intent,CREATE);
                }else if(id.equals(key) && output!=null){
                    if("write".equals(op)){
                        String b64=data.getString("data");if(b64.length()>131072)throw new IOException();
                        byte[] bytes=Base64.decode(b64,Base64.DEFAULT);
                        if(bytes.length==0||bytes.length>remaining)throw new IOException();
                        output.write(bytes);remaining-=bytes.length;reply.postMessage("ok");
                    }else if("end".equals(op)&&remaining==0){output.close();output=null;close("done");}
                    else close("error");
                }
            }catch(Exception e){close("error");}
        });
    }
    void selected(int result,Intent data){
        if(reply==null)return;
        if(result!=Activity.RESULT_OK||data==null||data.getData()==null){close("cancel");return;}
        try {output=host.getContentResolver().openOutputStream(data.getData(),"w");
            if(output==null)throw new IOException();reply.postMessage("ready");
        }catch(Exception e){close("error");}
    }
    void close(String message){
        if(output!=null)try{output.close();}catch(IOException ignored){}
        if(reply!=null)try{reply.postMessage(message);}catch(RuntimeException ignored){}
        reply=null;output=null;key=null;remaining=0;
    }
}
