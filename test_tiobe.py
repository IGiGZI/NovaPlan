import urllib.request
import re
import json

req = urllib.request.Request('https://www.tiobe.com/tiobe-index/', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

tables = re.findall(r'<table.*?>(.*?)</table>', html, re.DOTALL)
if len(tables) > 3:
    hof_table = tables[3]
    rows = re.findall(r'<tr>(.*?)</tr>', hof_table, re.DOTALL)
    if not rows:
        # Table 3 might not have <tr> correctly if it's malformed, but let's try
        rows = hof_table.split('<tr>')
    awards = {}
    for row in rows:
        cols = re.findall(r'<td>(.*?)</td>', row, re.DOTALL)
        if len(cols) >= 2:
            year = re.sub(r'<[^>]+>', '', cols[0]).strip()
            lang = re.sub(r'<[^>]+>', '', cols[1]).strip()
            if year and lang and year.isdigit():
                if lang.lower() not in awards:
                    awards[lang.lower()] = []
                awards[lang.lower()].append(int(year))
    print(json.dumps(awards, indent=2))
