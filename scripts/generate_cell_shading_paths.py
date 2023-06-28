#!/usr/bin/python

import math

offset = math.pi / 3
sqrt_2 = math.sqrt(2.0)

def clamp(low, value, high):
    if value < low:
        return low
    if value > high:
        return high
    return value

def get_coord(theta):
    x = math.cos(theta);
    y = math.sin(theta);

    m = max(math.fabs(x), math.fabs(y));
    x /= m;
    y /= m;

    x /= 2.0;
    y /= 2.0

    x += 0.5;
    y += 0.5;

    x = clamp(0.0, x, 1.0);
    y = clamp(0.0, y, 1.0);

    return (x,y)

print("[");
print("    [],")
print("    [")
print("        [[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0]],")
print("    ],")
for sections in range(2, 10):
    print("    [")
    for triangle in range(0, sections):
        theta0 = offset + 2*math.pi / sections * triangle
        theta1 = offset + 2*math.pi / sections * (triangle + 1)

        print("        [", end='')

        (x1, y1) = get_coord(theta0)
        print(f'[{x1}, {y1}], ', end='')
        (x2, y2) = get_coord(theta1)

        if x1 == 0.0 and x2 == 1.0:
            print('[0.0,0.0], ', end='')
            print('[1.0,0.0], ', end='')
        if x1 == 1.0 and x2 == 0.0:
            print('[1.0,1.0], ', end='')
            print('[0.0,1.0], ', end='')
        if y1 == 0.0 and y2 == 1.0:
            print('[1.0,0.0], ', end='')
            print('[1.0,1.0], ', end='')
        if y1 == 1.0 and y2 == 0.0:
            print('[0.0,1.0], ', end='')
            print('[0.0,0.0], ', end='')

        if x1 == 0.0 and y2 == 0.0:
            print('[0.0,0.0], ', end='')
        if y1 == 0.0 and x2 == 1.0:
            print('[1.0,0.0], ', end='')
        if x1 == 1.0 and y2 == 1.0:
            print('[1.0,1.0], ', end='')
        if y1 == 1.0 and x2 == 0.0:
            print('[0.0,1.0], ', end='')

        print(f'[{x2}, {y2}], ', end='')

        print("[0.5, 0.5]],")
    print("    ],")
print("];");
