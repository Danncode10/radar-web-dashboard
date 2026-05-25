// Servo angle finder - type an angle (0-180) in Serial Monitor to move servo.
// Use this to find the physical endpoints of your radar sweep.
// Signal wire (yellow/orange) on GPIO 14 (ESP32) or pin 9 (Arduino Uno). Baud: 115200.

#ifdef ESP32
  #include <ESP32Servo.h>
#else
  #include <Servo.h>
#endif

const int SERVO_PIN = 14;

Servo servo;

void setup() {
  Serial.begin(115200);
#ifdef ESP32
  servo.setPeriodHertz(50);
#endif
  servo.attach(SERVO_PIN, 500, 2500);
  servo.write(90);
  Serial.println("Servo angle finder ready.");
  Serial.println("Type an angle (0-180) and press Enter.");
  Serial.println("Current: 90");
}

void loop() {
  if (Serial.available()) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() == 0) return;
    int angle = input.toInt();
    if (angle >= 0 && angle <= 180) {
      servo.write(angle);
      Serial.print("Moved to: ");
      Serial.println(angle);
    } else {
      Serial.println("Out of range. Enter 0-180.");
    }
  }
}
