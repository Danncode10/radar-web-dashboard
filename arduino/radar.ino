// RADAR SYSTEM - ESP32 Firmware
// Servo sweep with HC-SR04 ultrasonic sensor and LED alert

const int SERVO_PIN = 14;
const int TRIG_PIN = 26;
const int ECHO_PIN = 27;
const int LED_PIN = 32;

const int SWEEP_STEP = 2;        // degrees per step
const int STEP_DELAY_MS = 30;    // ms per step
const float ALERT_DISTANCE = 50.0; // cm

volatile long echo_start = 0;
volatile long echo_duration = 0;

int currentAngle = 0;
int direction = 1; // 1 for forward, -1 for backward

void IRAM_ATTR echoInterrupt() {
  if (digitalRead(ECHO_PIN) == HIGH) {
    echo_start = micros();
  } else {
    echo_duration = micros() - echo_start;
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(SERVO_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  attachInterrupt(digitalPinToInterrupt(ECHO_PIN), echoInterrupt, CHANGE);

  // Initialize servo to 90 degrees
  servoWrite(90);
  delay(500);

  Serial.println("READY");
}

void loop() {
  // Sweep from 0 to 180 and back
  currentAngle += (SWEEP_STEP * direction);

  if (currentAngle >= 180) {
    currentAngle = 180;
    direction = -1;
  } else if (currentAngle <= 0) {
    currentAngle = 0;
    direction = 1;
  }

  // Move servo
  servoWrite(currentAngle);
  delay(STEP_DELAY_MS);

  // Measure distance
  float distance = measureDistance();

  // Alert LED
  if (distance < ALERT_DISTANCE && distance > 0) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  // Send data: "angle,distance"
  Serial.print(currentAngle);
  Serial.print(",");
  Serial.println(distance, 2);
}

void servoWrite(int angle) {
  // Convert angle (0-180) to pulse width (500-2500 microseconds)
  int pulseWidth = 500 + (angle * 2000 / 180);

  // Send PWM pulse
  digitalWrite(SERVO_PIN, HIGH);
  delayMicroseconds(pulseWidth);
  digitalWrite(SERVO_PIN, LOW);
  delayMicroseconds(20000 - pulseWidth);
}

float measureDistance() {
  // Trigger HC-SR04
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Wait for echo
  unsigned long timeout = millis() + 50;
  while (echo_duration == 0 && millis() < timeout) {
    delayMicroseconds(10);
  }

  long duration = echo_duration;
  echo_duration = 0;

  if (duration == 0) return -1;

  // Convert duration to distance: d = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;

  // Clamp to reasonable range
  if (distance > 400 || distance < 2) return -1;

  return distance;
}
