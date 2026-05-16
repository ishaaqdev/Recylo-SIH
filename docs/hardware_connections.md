# Recylo Hardware Connections

This document outlines the exact pin connections used on the Raspberry Pi 5 for the Recylo Smart Waste Segregation device.

<table border="1" cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th>Component</th>
      <th>Raspberry Pi Pin</th>
      <th>Type</th>
      <th>Function</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Pi Camera Module</td>
      <td>CSI Port</td>
      <td>MIPI CSI-2</td>
      <td>Captures RGB images for waste classification.</td>
    </tr>
    <tr>
      <td>3.5-inch Touch LCD</td>
      <td>DSI / GPIO SPI</td>
      <td>Display</td>
      <td>Shows user interface on the bin.</td>
    </tr>
    <tr>
      <td>Pan Servo (Base)</td>
      <td>GPIO 17 (Pin 11)</td>
      <td>PWM Output</td>
      <td>Rotates the routing platform to target bin sector.</td>
    </tr>
    <tr>
      <td>Tilt Servo (Flap)</td>
      <td>GPIO 27 (Pin 13)</td>
      <td>PWM Output</td>
      <td>Tilts the platform to drop waste into the bin.</td>
    </tr>
    <tr>
      <td>Rotate Servo (Optional)</td>
      <td>GPIO 22 (Pin 15)</td>
      <td>PWM Output</td>
      <td>Secondary positioning.</td>
    </tr>
    <tr>
      <td>HX711 (Load Cell 1 - Recyclable)</td>
      <td>DT: GPIO 5, SCK: GPIO 6</td>
      <td>Digital I/O</td>
      <td>Measures weight of recyclable bin.</td>
    </tr>
    <tr>
      <td>HX711 (Load Cell 2 - Non-Recyclable)</td>
      <td>DT: GPIO 13, SCK: GPIO 19</td>
      <td>Digital I/O</td>
      <td>Measures weight of non-recyclable bin.</td>
    </tr>
    <tr>
      <td>HX711 (Load Cell 3 - Organic)</td>
      <td>DT: GPIO 26, SCK: GPIO 20</td>
      <td>Digital I/O</td>
      <td>Measures weight of organic bin.</td>
    </tr>
    <tr>
      <td>HX711 (Load Cell 4 - Hazardous)</td>
      <td>DT: GPIO 21, SCK: GPIO 16</td>
      <td>Digital I/O</td>
      <td>Measures weight of hazardous bin.</td>
    </tr>
    <tr>
      <td>HC-SR04 (Ultrasonic 1 - Recyclable)</td>
      <td>Trig: GPIO 23, Echo: GPIO 24</td>
      <td>Digital I/O</td>
      <td>Measures fill level.</td>
    </tr>
    <tr>
      <td>HC-SR04 (Ultrasonic 2 - Non-Recyc)</td>
      <td>Trig: GPIO 25, Echo: GPIO 8</td>
      <td>Digital I/O</td>
      <td>Measures fill level.</td>
    </tr>
    <tr>
      <td>HC-SR04 (Ultrasonic 3 - Organic)</td>
      <td>Trig: GPIO 7, Echo: GPIO 1</td>
      <td>Digital I/O</td>
      <td>Measures fill level.</td>
    </tr>
    <tr>
      <td>HC-SR04 (Ultrasonic 4 - Hazardous)</td>
      <td>Trig: GPIO 12, Echo: GPIO 14</td>
      <td>Digital I/O</td>
      <td>Measures fill level.</td>
    </tr>
  </tbody>
</table>

### Important Notes
- Power: Provide dedicated 5V/3A power to the servos to prevent the Raspberry Pi from rebooting under load.
- Grounding: Ensure all sensor ground pins share a common ground with the Raspberry Pi.
