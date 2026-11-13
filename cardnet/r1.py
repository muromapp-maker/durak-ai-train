from playwright.sync_api import sync_playwright
import os,sys
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); errs=[]
    ini=sys.argv[1].replace('/h','/init_h')
    if os.path.exists(ini): pg.add_init_script(open(ini).read()); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://'+os.path.abspath('web/index.html')); pg.wait_for_timeout(800)
    print(pg.evaluate(open(sys.argv[1]).read())); print(errs)
