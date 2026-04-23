package com.vmstudios.killerdarts;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.splashscreen.SplashScreenPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(SplashScreenPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
