import re, glob

ROOT = "/data/meridian/fullstack/public"

emoji = re.compile(
    "["
    "\U0001F000-\U0001FAFF" 
    "\u2600-\u26FF"          
    "\u2700-\u27BF"          
    "\u2B00-\u2BFF"          
    "\u2190-\u21FF"          
    "\uFE0F\u200D"           
    "\u2139\u2714\u2716\u274C\u2705\u26A0"  
    "]"
)

files = glob.glob(ROOT + "/js/*.js") + glob.glob(ROOT + "/js/modules/*.js")
for f in files:
    s = open(f, encoding="utf-8").read()
    orig = s
    s = emoji.sub("", s)
    s = s.replace('toast(" " + ', 'toast(')
    s = s.replace('toast(" ', 'toast("')
    s = re.sub(r'(icon: ")\s*(")', r'\1\2', s)
    s = re.sub(r'(<h[234]>)\s+', r'\1', s)
    if s != orig:
        open(f, "w", encoding="utf-8").write(s)
        print("limpio:", f.split("public/")[1])

f = ROOT + "/js/app.js"
s = open(f, encoding="utf-8").read()
old = "nav.innerHTML = App.routes.map((r) => '<a href=\"#/' + r.id + '\" data-id=\"' + r.id + '\">' + r.icon + ' <span class=\"lbl\">' + r.title + \"</span></a>\").join(\"\");"
new = "nav.innerHTML = App.routes.map((r, i) => '<a href=\"#/' + r.id + '\" data-id=\"' + r.id + '\"><span class=\"idx\">' + String(i + 1).padStart(2, \"0\") + '</span><span class=\"lbl\">' + r.title + \"</span></a>\").join(\"\");"
if old in s:
    s = s.replace(old, new)
    open(f, "w", encoding="utf-8").write(s)
    print("nav numerado OK")
else:
    print("AVISO: linea de nav no encontrada, revisar manualmente")
    import sys
    for i, line in enumerate(s.split("\n")):
        if "nav.innerHTML" in line:
            print(i + 1, line)
