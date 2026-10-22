#include <WiFi.h>
#include <WebServer.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

constexpr uint8_t TRIG_PIN = 5; // HC-SR04 TRIG
constexpr uint8_t ECHO_PIN = 18; // HC-SR04 ECHO through a 5 V-to-3.3 V divider
constexpr float ALERT_DISTANCE_CM = 150.0f;

WebServer server(80);

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-store");
}

void handleOptions() {
  addCorsHeaders();
  server.send(204);
}

void handleNode() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  const unsigned long pulseDuration = pulseIn(ECHO_PIN, HIGH, 30000);
  const float distanceCm = pulseDuration ? pulseDuration * 0.0343f / 2.0f : -1.0f;
  const bool breach = distanceCm > 0 && distanceCm < ALERT_DISTANCE_CM;

  String json = "{\"node\":\"NODE 01\",\"online\":true,\"distanceCm\":";
  json += distanceCm > 0 ? String(distanceCm, 1) : "null";
  json += ",\"breach\":";
  json += breach ? "true" : "false";
  json += "}";

  addCorsHeaders();
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("ESP32 address: http://");
  Serial.println(WiFi.localIP());

  server.on("/api/node", HTTP_OPTIONS, handleOptions);
  server.on("/api/node", HTTP_GET, handleNode);
  server.begin();
}

void loop() {
  server.handleClient();
}
