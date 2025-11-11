import re
import csv

def convert_to_csv(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        ocr_text = f.read()

    all_data = []
    pages = ocr_text.split('==End of OCR for page')

    for page_num, page_content in enumerate(pages):
        if not page_content.strip():
            continue

        room_no_match = re.search(r'কক্ষ নং\s*[- ]\s*([\w-]+)', page_content)
        room_no = room_no_match.group(1).strip() if room_no_match else f'Page_{page_num+1}'

        lines = page_content.split('\n')
        clean_lines = []
        for line in lines:
            if any(keyword in line for keyword in ['সিলেট পলিটেকনিক', 'ডিপ্লোমা-ইন-ইঞ্জিনিয়ারিং', 'আসন বিন্যাস', 'অধ্যক্ষ', 'Nos.', 'SPI:', 'POLYTECHNIC INSTITUTE', 'SYLHET', ' পর্ব', ' পরীক্ষা', 'কক্ষ নং']):
                continue
            clean_lines.append(line.strip())
        
        clean_content = ' '.join(clean_lines)
        
        tokens = re.findall(r'(\b\d/\w+\b|\b\d{6,8}\b|\b[xX]\b)', clean_content)
        
        i = 0
        while i < len(tokens) - 1:
            if re.fullmatch(r'\d/\w+', tokens[i]) and re.fullmatch(r'\d{6,8}|[xX]', tokens[i+1]):
                all_data.append([room_no, tokens[i], tokens[i+1]])
                i += 2
            else:
                i += 1
                
    unique_data = []
    seen = set()
    for item in all_data:
        item_tuple = tuple(item)
        if item_tuple not in seen:
            unique_data.append(item)
            seen.add(item_tuple)

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Room No', 'Department', 'Roll'])
        writer.writerows(unique_data)

if __name__ == '__main__':
    convert_to_csv('ocr.txt', 'SET_PLAN.csv')