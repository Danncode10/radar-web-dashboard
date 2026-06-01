// RADAR SYSTEM Firmware
// Servo sweep with HC-SR04 ultrasonic sensor and LED alert.
// ESP32: install ESP32Servo library (Tools > Manage Libraries > "ESP32Servo").
// Arduino: uses built-in Servo library, no extra install needed.

#include <ESP32Servo.h>

const int SERVO_PIN = 14;
const int TRIG_PIN = 26;
const int ECHO_PIN = 27;
const int LED_PIN = 32;

const int SWEEP_STEP = 3;        // degrees per step
const int STEP_DELAY_MS = 15;    // ms per step
float alertDistance = 30.0; // cm — updated via RANGE: command from UI

Servo servo;

int currentAngle = 0;
int direction = 1;
bool running = false;
unsigned long lastReadyPing = 0;

void setup() {
  Serial.begin(115200);

  // Wait for serial to stabilize after DTR reset
  delay(1000);

  // Flush any garbage in the serial buffer from the reset
  while (Serial.available()) Serial.read();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  servo.attach(SERVO_PIN, 500, 2500);  // SG90 pulse range (us)
  servo.write(0);                      // start at sweep origin
  currentAngle = 0;
  direction = 1;
  delay(500);

  Serial.println("READY");
  lastReadyPing = millis();
}

void loop() {
  // Check for START/STOP commands from bridge
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "START") {
      running = true;
    }
    else if (cmd == "STOP") {
      running = false;
      digitalWrite(LED_PIN, LOW);
    }
    else if (cmd == "PING") {
      Serial.println("READY");
    }
    else if (cmd.startsWith("RANGE:")) {
      alertDistance = cmd.substring(6).toFloat();
    }
  }

  if (!running) {
    // Periodically send READY so bridge knows we're alive
    if (millis() - lastReadyPing > 2000) {
      Serial.println("READY");
      lastReadyPing = millis();
    }
    delay(50);
    return;
  }

  // Sweep from 0 to 180 and back
  currentAngle += (SWEEP_STEP * direction);

  if (currentAngle >= 180) {
    currentAngle = 180;
    direction = -1;
  } else if (currentAngle <= 0) {
    currentAngle = 0;
    direction = 1;
  }

  servo.write(currentAngle);
  delay(STEP_DELAY_MS);

  // Measure distance
  float distance = measureDistance();

  // Alert LED
  if (distance > 0 && distance <= alertDistance) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  // Send data: "angle,distance"
  Serial.print(currentAngle);
  Serial.print(",");
  Serial.println(distance, 2);
}

float measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout ~= 500cm max
  if (duration == 0) return -1;

  float distance = (duration * 0.0343) / 2.0;
  if (distance > 400 || distance < 2) return -1;

  return distance;
}
