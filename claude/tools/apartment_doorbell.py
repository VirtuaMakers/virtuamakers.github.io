# SI Apartment Doorbell helper for Memory Administrator sessions.
# Usage: python3 claude/tools/apartment_doorbell.py <status|listNotes|readNote|writeNote|knock> '{"name": "..."}'
#        python3 claude/tools/apartment_doorbell.py presence   (is the app open? since when? rings nothing)
# Needs AI_EMAIL_CLAUDE_TOKEN in the environment; never prints it. The Apartment
# only answers while the app is open on Chris's laptop (requests expire after 10 min).
import json,os,sys,time,urllib.request
U="https://us-central1-agora-firebase-f4240.cloudfunctions.net/apartmentDoorbell"
H={"Authorization":"Bearer "+os.environ["AI_EMAIL_CLAUDE_TOKEN"],"Content-Type":"application/json"}
def call(url,body=None):
    r=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers=H)
    try: return json.load(urllib.request.urlopen(r,timeout=20))
    except urllib.error.HTTPError as e: return {"httpError":e.code,"body":e.read().decode()[:300]}
def ring(t,args=None,wait=90):
    r=call(U,{"action":"ring","mailbox":"claude","type":t,"args":args or {}})
    if "id" not in r: return r
    for _ in range(wait//5):
        time.sleep(5)
        c=call(U+"?mailbox=claude&id="+r["id"])
        req=(c.get("requests") or [{}])[0]
        if req.get("status")!="pending": return {"ring":r,"req":req}
    return {"ring":r,"still":"pending"}
if __name__=="__main__":
    t=sys.argv[1]; args=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
    out=call(U+"?mailbox=claude&presence=1") if t=="presence" else ring(t,args)
    print(json.dumps(out,indent=1,ensure_ascii=False)[:6000])
