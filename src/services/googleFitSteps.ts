// Google Fit – Günlük toplam adım verisini çeker
// capacitor 7 ile %100 uyumlu (plugin yok)

const DATA_SOURCE = "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps";

export async function getTodaySteps(accessToken: string): Promise<number> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = now.getTime();

    const body = {
      aggregateBy: [
        {
          dataTypeName: "com.google.step_count.delta",
          dataSourceId: DATA_SOURCE
        }
      ],
      bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
      startTimeMillis: startOfDay,
      endTimeMillis: end
    };

    const res = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    const json = await res.json();

    // Yanıt parse
    const buckets = json.bucket ?? [];
    if (buckets.length === 0) return 0;

    const dataset = buckets[0].dataset?.[0]?.point ?? [];
    if (dataset.length === 0) return 0;

    const steps = dataset[0]?.value?.[0]?.intVal ?? 0;

    return steps;

  } catch (err) {
    console.error("Google Fit getTodaySteps error:", err);
    return 0;
  }
}
