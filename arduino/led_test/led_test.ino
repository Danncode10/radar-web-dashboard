// LED test - blinks the alert LED on and off every 500ms.
// LED anode (+) through a 220ohm resistor to GPIO 32, cathode (-) to GND.

const int LED_PIN = 32;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("LED blink test");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(500);

  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(500);
}
