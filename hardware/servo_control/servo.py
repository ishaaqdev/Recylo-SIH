import RPi.GPIO as GPIO
import time

SERVO_PIN = 17  # change as needed

GPIO.setmode(GPIO.BCM)
GPIO.setup(SERVO_PIN, GPIO.OUT)

pwm = GPIO.PWM(SERVO_PIN, 50)
pwm.start(0)

def rotate(angle):
    duty = 2 + (angle / 18)
    GPIO.output(SERVO_PIN, True)
    pwm.ChangeDutyCycle(duty)
    time.sleep(0.4)
    GPIO.output(SERVO_PIN, False)
    pwm.ChangeDutyCycle(0)

def sort_to_bin(category):
    mapping = {
        "organic": 0,
        "recyclable_plastic": 45,
        "recyclable_metal": 90,
        "recyclable_glass": 135,
        "recyclable_cardboard": 180,
        "non_recyclable": 225,
        "hazardous_biomedical": 270,
        "hazardous_e-waste": 315
    }

    angle = mapping.get(category, 0)
    rotate(angle)

if __name__ == "__main__":
    print("Testing servo at 0, 90, 180")
    rotate(0)
    time.sleep(1)
    rotate(90)
    time.sleep(1)
    rotate(180)
    time.sleep(1)
    pwm.stop()
    GPIO.cleanup()
