package com.addis.clinicalpharmacy;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity with FLAG_SECURE
 * Blocks screenshots and screen recording at the OS level.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ Block screenshots, screen recording, and recent apps preview
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }
}
