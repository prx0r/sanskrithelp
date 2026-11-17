import json, urllib.request
from playwright.sync_api import sync_playwright
print("===== MCP (live) =====")
URL='https://sanskrit.help/mcp'; UA='Mozilla/5.0 (compatible; verify/1.0)'
def rpc(m,p=None,i=1):
    b={'jsonrpc':'2.0','id':i,'method':m}
    if p is not None: b['params']=p
    r=urllib.request.Request(URL,data=json.dumps(b).encode(),headers={'Content-Type':'application/json','User-Agent':UA,'Accept':'application/json, text/event-stream'})
    return json.loads(urllib.request.urlopen(r,timeout=25).read().decode())
def call(n,a,i=2):
    r=rpc('tools/call',{'name':n,'arguments':a},i).get('result',{})
    return {'ERR': r['content'][0]['text']} if r.get('isError') else r.get('structuredContent')
rpc('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'v','version':'1'}})
tools=[t['name'] for t in rpc('tools/list')['result']['tools']]
print('tools', len(tools), tools)
print('teach n1 table rows:', len(call('teach',{'stage':'n1'},2)['table']), '| has sentence:', 'example_sentence' in call('teach',{'stage':'n1'},3))
print('parse:', call('parse',{'stem':'agni','form':'agnaye','case':'dative','number':'singular'},4)['verdict'])
print('sentence:', call('sentence',{'case':'genitive'},5)['prompt'][:50])
print('attested:', len(call('attested',{},6)['entries']))
print('drill withheld:', 'answer' not in call('drill',{'track':'verb'},7))
print('harness protocol:', len(call('harness',{},8)['protocol']), 'rules')
print()
print("===== APP (live) =====")
errs=[]
def ready(pg):
    pg.wait_for_timeout(1200)
    try:
        btn = pg.query_selector('#btn-startdrill')
        if btn and btn.is_visible():
            btn.click(); pg.wait_for_timeout(800)
    except Exception:
        pass
    pg.wait_for_selector('#input:not([disabled])', timeout=15000); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for w,h,n in [(1340,950,'desk'),(390,844,'mob')]:
        pg=b.new_page(viewport={'width':w,'height':h})
        pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
        pg.goto('https://sanskrit.help/', wait_until='networkidle'); ready(pg)
        sc=pg.evaluate("({v:document.documentElement.scrollHeight>innerHeight+1,h:document.documentElement.scrollWidth>innerWidth+1})")
        print(f'{n}: scroll v={sc["v"]} h={sc["h"]} stages={pg.eval_on_selector_all(".pstage","e=>e.length")}')
        pg.close()
    # deep flow on desktop
    pg=b.new_page(viewport={'width':1340,'height':950})
    pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
    pg.goto('https://sanskrit.help/', wait_until='networkidle'); ready(pg)
    # unlock n2 by passing n1: answer 10 via pad/state
    for i in range(10):
        m = pg.evaluate("window.__prakriya.q.mode")
        if m == 'family':
            pg.click('.fampad button'); pg.wait_for_timeout(400)
        else:
            ans = pg.evaluate("window.__prakriya.q.answer")
            pg.fill('#input', ans if isinstance(ans,str) else 'x'); pg.click('#btn-check'); pg.wait_for_timeout(350)
        pg.keyboard.press('Enter'); pg.wait_for_timeout(650)
    print('n1 tries:', pg.evaluate("window.__prakriya.stats.stages.n1 && window.__prakriya.stats.stages.n1.t"),
          'n2 unlocked:', pg.evaluate("!document.querySelector('[data-stage=n2]').disabled"))
    # review row exists
    print('review row:', bool(pg.query_selector('[data-review]')))
    # confusion: seed a known slot, then mistype its answer elsewhere
    pg.evaluate("()=>{window.__prakriya.stats.slots['a-masc|sasthi|eka']={t:5,r:5,e:2.5,i:1,due:0,exp:'devasya'};}")
    pg.evaluate("()=>{const S=window.__prakriya; S.stage={id:'t',track:'noun',title:'t',modes:['build'],families:['a-masc'],cases:['prathama']}; S.mode='build'; S.answered=true;}")
    pg.keyboard.press('Enter'); pg.wait_for_timeout(900)
    pg.fill('#input','devasya'); pg.click('#btn-check'); pg.wait_for_timeout(500)
    print('confusion note:', 'look closer' in pg.inner_text('#yours').lower())
    print('srs slots:', pg.evaluate("Object.keys(window.__prakriya.stats.slots).length"),
          '| due now:', pg.evaluate("Object.entries(window.__prakriya.stats.slots).filter(([k,v])=>v.due<=Date.now()).length"))
    # x-stage verbs mix + case strip
    print('case dots:', pg.eval_on_selector_all('.cdot','e=>e.length'))
    print('errors:', errs or 'none')
    b.close()
