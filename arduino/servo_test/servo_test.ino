// Servo test - sweeps the SG90 from 0 to 180 and back, forever.
// Requires the ESP32Servo library (Tools > Manage Libraries > "ESP32Servo").
// Signal wire (yellow/orange) on GPIO 14.

#include <ESP32Servo.h>

const int SERVO_PIN = 14;

Servo servo;

void setup() {
  Serial.begin(115200);
  servo.setPeriodHertz(50);            // standard 50Hz servo
  servo.attach(SERVO_PIN, 500, 2500);  // SG90 pulse range (us)
  Serial.println("Servo test: sweeping 0 -> 180 -> 0");
}

void loop() {
  for (int a = 0; a <= 180; a++) {
    servo.write(a);
    Serial.print("Angle: ");
    Serial.println(a);
    delay(15); // smooth motion
  }
  for (int a = 180; a >= 0; a--) {
    servo.write(a);
    Serial.print("Angle: ");
    Serial.println(a);
    delay(15);
  }
}
