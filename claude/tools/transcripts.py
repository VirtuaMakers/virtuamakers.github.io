# Conversation-only session transcripts for the SI Apartment 🏢 (Memory Administrator 🚚).
# Keeps Chris's messages and Claude's visible replies; drops tool calls/output and harness notes.
#
#   python3 claude/tools/transcripts.py ingest <store_dir> <session_id> <list_events_result_file>
#       Add one saved list_events page (kinds user+assistant) to <store_dir>/<session_id>.json.
#       Prints {"first_id","has_more","added","total","from"}; page back with before_id=first_id
#       until has_more is false/missing. An inline (small) result can be saved to a file first.
#   python3 claude/tools/transcripts.py file <store_dir> <session_id> <short-name> "<title>"
#       Write transcript-<short-name>-NN.md notes (< 9,999 characters each) through the Doorbell 🔔
#       and add a line to the Apartment's index.md.
import json, os, re, sys, importlib.util

# Chris's messages often start with a harness <system-reminder> block ("Message sent at ...");
# strip those first so his words aren't dropped with the harness-only notes below.
REMINDERS = re.compile(r'^\s*(<system-reminder>.*?</system-reminder>\s*)+', re.S)

def ingest(store_dir, sid, path):
    os.makedirs(store_dir, exist_ok=True)
    raw = open(path).read()
    line = [l for l in raw.split('\n') if l.strip().startswith('{')][0]
    d = json.loads(line); d = d.get('ccr', d)
    store = os.path.join(store_dir, sid + '.json')
    msgs = json.load(open(store)) if os.path.exists(store) else {}
    n = 0
    for e in d['data']:
        for k in ('assistant', 'user'):
            if k not in e: continue
            m = e[k].get('internal_anthropic_catchall', e[k]).get('message', {})
            c = m.get('content')
            if isinstance(c, str): c = [{'type': 'text', 'text': c}]
            texts = [REMINDERS.sub('', b.get('text', '')) for b in (c or []) if b.get('type') == 'text']
            texts = [t for t in texts if t.strip() and not t.lstrip().startswith('<')]
            if texts:
                uid = e[k].get('uuid') or e[k].get('internal_anthropic_catchall', {}).get('uuid') or e['created_at'] + k
                msgs[uid] = {'t': e['created_at'], 'who': 'Chris' if k == 'user' else 'Claude', 'text': '\n'.join(texts)}
                n += 1
    json.dump(msgs, open(store, 'w'))
    ts = [e['created_at'] for e in d['data']]
    print(json.dumps({'first_id': d.get('first_id'), 'has_more': d.get('has_more'), 'added': n,
                      'total': len(msgs), 'from': min(ts) if ts else None}))

def doorbell():
    here = os.path.dirname(os.path.abspath(__file__))
    spec = importlib.util.spec_from_file_location('doorbell', os.path.join(here, 'apartment_doorbell.py'))
    mod = importlib.util.module_from_spec(spec); argv = sys.argv; sys.argv = ['x']
    spec.loader.exec_module(mod); sys.argv = argv
    return mod

def file(store_dir, sid, name, title):
    msgs = sorted(json.load(open(os.path.join(store_dir, sid + '.json'))).values(), key=lambda x: x['t'])
    body = ''.join("\n**%s** (%s UTC)\n%s\n" % (x['who'], x['t'][:16].replace('T', ' '), x['text'].strip()) for x in msgs)
    parts, cur = [], ''
    for b in re.split(r'(?=\n\*\*(?:Chris|Claude)\*\* \()', body):
        while len(b) > 9000:
            if cur: parts.append(cur); cur = ''
            parts.append(b[:9000]); b = b[9000:]
        if len(cur) + len(b) > 9000: parts.append(cur); cur = ''
        cur += b
    if cur.strip(): parts.append(cur)
    db = doorbell(); n = len(parts); bad = 0
    for i, p in enumerate(parts, 1):
        head = ("# Transcript – %s – part %d of %d\n\nConversation only (Chris's messages and Claude's "
                "visible replies; tool calls and their output left out). Filed by Memory Administrator 🚚.\n") % (title, i, n)
        r = db.ring('writeNote', {'name': 'transcript-%s-%02d.md' % (name, i), 'text': head + p})
        ok = isinstance(r.get('req', {}).get('result'), dict) and r['req']['result'].get('saved')
        bad += 0 if ok else 1
        print('part', i, 'of', n, 'ok' if ok else r, flush=True)
    if bad: sys.exit('%d parts failed - re-run before indexing' % bad)
    idx = db.ring('readNote', {'name': 'index.md'})['req']['result']['text']
    idx += "- `transcript-%s-01..%02d.md` – %s (%d messages).\n" % (name, n, title, len(msgs))
    print(db.ring('writeNote', {'name': 'index.md', 'text': idx})['req']['result'])

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'ingest': ingest(*sys.argv[2:5])
    elif cmd == 'file': file(*sys.argv[2:6])
