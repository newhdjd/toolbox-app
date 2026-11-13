package com.toolbox.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

public class MainActivity extends Activity {

    private static final String HOME_URL = "https://37jamnj6ip4n3i2dq5k.traesite.cn";
    private static final String VERSION_JSON_URL = "https://37jamnj6ip4n3i2dq5k.traesite.cn/version.json";
    private static final int SITE_BG = 0xFFF5F6FB;

    private WebView webView;
    private AlertDialog updateDialog;
    private int localVersionCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            localVersionCode = getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (Exception e) {
            localVersionCode = 0;
        }

        getWindow().setBackgroundDrawable(new ColorDrawable(SITE_BG));
        getWindow().getDecorView().setBackgroundColor(SITE_BG);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
        }
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
        hideSystemUI();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.loadUrl(HOME_URL);

        // 延迟 3 秒后检查更新（等网页先加载完，不打扰）
        new Handler(Looper.getMainLooper()).postDelayed(this::checkUpdate, 3000);
    }

    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        );
    }

    // === 更新检测 ===
    private void checkUpdate() {
        new Thread(() -> {
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(VERSION_JSON_URL).openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Cache-Control", "no-cache");

                int code = conn.getResponseCode();
                if (code != 200) return;

                InputStream is = conn.getInputStream();
                String json = new Scanner(is, "UTF-8").useDelimiter("\\A").next();
                is.close();

                JSONObject obj = new JSONObject(json);
                int remoteCode = obj.getInt("version_code");
                if (remoteCode <= localVersionCode) return; // 没有新版本

                String versionName = obj.optString("version_name", "");
                String title = obj.optString("title", "发现新版本");
                String desc = obj.optString("desc", "");
                String apkUrl = obj.optString("apk_url", "");
                boolean force = obj.optBoolean("force", false);

                new Handler(Looper.getMainLooper()).post(() ->
                    showUpdateDialog(title, versionName, desc, apkUrl, force)
                );
            } catch (Exception ignored) {
                // 检查失败就静默跳过，不打扰用户
            }
        }).start();
    }

    private void showUpdateDialog(String title, String versionName, String desc, String apkUrl, boolean force) {
        StringBuilder msg = new StringBuilder();
        if (!versionName.isEmpty()) msg.append("版本：").append(versionName).append("\n\n");
        if (!desc.isEmpty()) msg.append(desc).append("\n\n");
        if (force) msg.append("⚠ 此为强制更新，更新后才能继续使用");
        else msg.append("是否立即更新？");

        AlertDialog.Builder b = new AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(msg.toString())
            .setPositiveButton("立即更新", (d, w) -> downloadAndInstall(apkUrl))
            .setCancelable(!force);

        if (!force) {
            b.setNegativeButton("稍后再说", null);
        }
        updateDialog = b.create();
        updateDialog.show();
    }

    // === 下载 + 安装 ===
    private void downloadAndInstall(String apkUrl) {
        new AlertDialog.Builder(this)
            .setTitle("下载中")
            .setMessage("正在下载最新版，请稍候...")
            .setCancelable(false)
            .show();

        new Thread(() -> {
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(apkUrl).openConnection();
                conn.setConnectTimeout(10000);
                conn.setRequestMethod("GET");

                int code = conn.getResponseCode();
                if (code != 200) {
                    runOnUiThread(() -> showUpdateDialog("下载失败", "", "无法获取安装包 (HTTP " + code + ")", apkUrl, false));
                    return;
                }

                InputStream is = conn.getInputStream();

                File dir;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "updates");
                } else {
                    dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "updates");
                }
                if (!dir.exists()) dir.mkdirs();

                // 清掉旧的 APK
                for (File f : dir.listFiles()) {
                    if (f.getName().endsWith(".apk")) f.delete();
                }

                File apkFile = new File(dir, "toolbox-update.apk");
                FileOutputStream fos = new FileOutputStream(apkFile);

                byte[] buf = new byte[8192];
                int n;
                while ((n = is.read(buf)) > 0) fos.write(buf, 0, n);
                is.close();
                fos.close();

                runOnUiThread(() -> installApk(apkFile));
            } catch (Exception e) {
                runOnUiThread(() -> showUpdateDialog("下载失败", "", e.getMessage(), apkUrl, false));
            }
        }).start();
    }

    private void installApk(File apkFile) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Uri apkUri;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            apkUri = FileProvider.getUriForFile(this, "com.toolbox.app.fileprovider", apkFile);
        } else {
            apkUri = Uri.fromFile(apkFile);
        }
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        startActivity(intent);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUI();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private boolean firstResume = true;

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            if (!firstResume) {
                webView.reload();
            }
            firstResume = false;
        }
        hideSystemUI();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
