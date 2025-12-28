package com.snaccit.dashboard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager; // Added
import androidx.core.app.NotificationCompat;

public class KeepAliveService extends Service {

    private PowerManager.WakeLock wakeLock; // Added to hold CPU awake

    @Override
    public void onCreate() {
        super.onCreate();
        startForegroundService();
        acquireWakeLock(); // Keep CPU running
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void startForegroundService() {
        String channelId = "SnaccitKeepAlive";
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    channelId,
                    "Snaccit Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps the app alive to listen for orders");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }

        Notification notification = new NotificationCompat.Builder(this, channelId)
                .setContentTitle("Snaccit Partner")
                .setContentText("Listening for new orders...")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true) // Crucial: User cannot swipe it away
                .build();

        startForeground(101, notification);
    }

    // ★ ADDED: Forces the CPU to stay awake even if screen is off ★
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "Snaccit::KeepAliveWakelock");
            wakeLock.acquire(); 
        }
    }
}