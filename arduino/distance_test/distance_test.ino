// Distance sensor test - prints HC-SR04 readings to the Serial Monitor.
// TRIG on GPIO 26, ECHO on GPIO 27. Open Serial Monitor at 115200 baud.

const int TRIG_PIN = 26;
const int ECHO_PIN = 27;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  Serial.println("HC-SR04 distance test");
}

void loop() {
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m max)

  if (duration == 0) {
    Serial.println("No echo - out of range or check wiring");
  } else {
    float distance = duration * 0.0343 / 2.0; // speed of sound / 2
    Serial.print("Distance: ");
    Serial.print(distance, 1);
    Serial.println(" cm");
  }

  delay(300);
}
