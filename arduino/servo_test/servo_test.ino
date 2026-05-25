// Servo test - sweeps the SG90 from 0 to 180 and back, forever.
// Signal wire (yellow/orange) on GPIO 14.

const int SERVO_PIN = 14;

// Send one ~50Hz PWM pulse to hold/move the servo to `angle`.
void servoPulse(int angle) {
  int pulseWidth = map(angle, 0, 180, 500, 2500); // microseconds
  digitalWrite(SERVO_PIN, HIGH);
  delayMicroseconds(pulseWidth);
  digitalWrite(SERVO_PIN, LOW);
  delay(20); // rest of the 20ms frame
}

void setup() {
  Serial.begin(115200);
  pinMode(SERVO_PIN, OUTPUT);
  Serial.println("Servo test: sweeping 0 -> 180 -> 0");
}

void loop() {
  for (int a = 0; a <= 180; a += 5) {
    for (int i = 0; i < 5; i++) servoPulse(a); // ~100ms to reach the step
    Serial.print("Angle: ");
    Serial.println(a);
  }
  for (int a = 180; a >= 0; a -= 5) {
    for (int i = 0; i < 5; i++) servoPulse(a);
    Serial.print("Angle: ");
    Serial.println(a);
  }
}
