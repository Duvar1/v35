package com.vaktinamaz.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(StepCounterPlugin.class);
    }
}
```

---

## 5. React/TypeScript - Plugin Tanımı
**Konum:** `src/plugins/StepCounter.ts`

```typescript
import { registerPlugin } from '@capacitor/core';

export interface StepCounterPlugin {
  requestPermissions(): Promise;
  checkPermission(): Promise;
  startService(): Promise;
  stopService(): Promise;
  resetSteps(): Promise;
  addListener(
    eventName: 'stepUpdate',
    listenerFunc: (data: { steps: number }) => void
  ): Promise;
  removeAllListeners(): Promise;
}

const StepCounter = registerPlugin('StepCounter');

export default StepCounter;