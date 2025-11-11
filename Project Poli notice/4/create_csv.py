import re
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
input_file_path = os.path.join(script_dir, 'Result.txt')
output_file_path = os.path.join(script_dir, 'Result.csv')

try:
    with open(input_file_path, 'r') as f:
        file_content = f.read()
except FileNotFoundError:
    print(f"Error: The file '{input_file_path}' was not found.")
    exit()

lines = file_content.strip().splitlines()

csv_data = "Roll,CGPA,Grade\n"
current_grade = None
grade_pattern = re.compile(r'\d+ Students Got (.+)')
failed_pattern = re.compile(r'\d+ Students Failed In .+')
passed_student_pattern = re.compile(r'(\d+) \((\d+\.\d+)\)')
failed_student_pattern = re.compile(r'(\d+)\s*{.*}')

for line in lines:
    line = line.strip()
    grade_match = grade_pattern.match(line)
    if grade_match:
        current_grade = grade_match.group(1).strip()
        continue

    if failed_pattern.match(line):
        current_grade = "Failed"
        continue

    if current_grade:
        if current_grade != "Failed":
            student_match = passed_student_pattern.match(line)
            if student_match:
                roll = student_match.group(1)
                cgpa = student_match.group(2)
                csv_data += f"{roll},{cgpa},{current_grade}\n"
        else:
            student_match = failed_student_pattern.match(line)
            if student_match:
                roll = student_match.group(1)
                csv_data += f"{roll},N/A,Failed\n"

with open(output_file_path, 'w') as f:
    f.write(csv_data)

print(f"Successfully created '{output_file_path}'")