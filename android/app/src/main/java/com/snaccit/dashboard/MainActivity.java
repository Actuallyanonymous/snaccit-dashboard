package com.snaccit.dashboard;

import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.content.ContentResolver;
import android.net.Uri;
import android.os.Build;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createCriticalAlarmChannel();
    }

    private void createCriticalAlarmChannel() {
        // This logic runs on Android 8.0+ (99% of phones today)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            
            // 1. Define a NEW, UNIQUE Channel ID
            String channelId = "orders_critical_alarm_v1"; 
            CharSequence channelName = "CRITICAL ORDER ALARM";
            String channelDescription = "Plays loud alarm sound for new orders, bypassing silent mode.";

            // 2. Set Importance to HIGH (Heads-up notification)
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);
            channel.setDescription(channelDescription);

            // 3. NUCLEAR OPTION: Set Audio Usage to ALARM
            // This is the secret sauce. It forces the sound to play on the ALARM stream.
            // Even if the phone is on Silent or Vibrate, Alarms still ring.
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM) 
                    .build();

            // 4. Point to the sound file (Ensure alert.mp3 is in res/raw)
            // Note: We use "alert" without .mp3 extension for the resource URI
            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/alert");
            
            channel.setSound(soundUri, audioAttributes);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC); // Show on lock screen
            channel.setBypassDnd(true); // Attempt to bypass Do Not Disturb

            // 5. Create the channel
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}