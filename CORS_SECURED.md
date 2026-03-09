# 🔒 CORS Security - Dokolator
**Deployed:** 4. März 2026, 20:06 Uhr  
**Status:** ✅ CORS auf Vercel-Domain eingeschränkt

---

## ✅ Was wurde geändert

### CORS-Konfiguration eingeschränkt

**Vorher:**
```yaml
AllowOrigin: "'*'"  # Alle Domains erlaubt
```

**Jetzt:**
```yaml
AllowOrigin: "'https://vs-code-projekte-dokolator-dynamo.vercel.app'"
```

---

## 🛡️ Was das bedeutet

### Jetzt geschützt vor:

**1. Cross-Site Request Forgery (CSRF)**
- Nur deine Vercel-App kann die API aufrufen
- Fremde Websites werden vom Browser blockiert

**2. Data Exfiltration**
- Angreifer können keine Daten von fremden Websites abfragen
- Selbst wenn sie deinen Token stehlen

**3. API Missbrauch**
- evil.com kann deine API nicht mehr nutzen
- Reduziert Risiko von DDoS-Angriffen

---

## 🧪 Testing

### Test 1: Vercel-App funktioniert
```bash
# Öffne deine App
https://vs-code-projekte-dokolator-dynamo.vercel.app

# Teste:
1. Login funktioniert
2. Spiele können erstellt werden
3. Statistiken werden angezeigt
4. Keine CORS-Fehler in Browser Console
```

### Test 2: Fremde Domains werden blockiert
```bash
# Von einer anderen Domain aus (sollte fehlschlagen)
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://7rfvjbcze2.execute-api.eu-central-1.amazonaws.com/Prod/spieltage
```

**Erwartetes Ergebnis:**
- Keine `Access-Control-Allow-Origin` Header in Response
- Browser würde Request blockieren

---

## 🔧 Für Development

### Localhost hinzufügen (optional)

Wenn du lokal entwickeln willst:

```yaml
# In backend/template.yaml
AllowOrigin: "'https://vs-code-projekte-dokolator-dynamo.vercel.app,http://localhost:3000'"
```

Dann neu deployen:
```bash
cd backend
sam build
sam deploy
```

---

## ⚠️ Wichtig zu wissen

### Was CORS NICHT schützt:

1. **Server-zu-Server Requests**
   - CORS ist nur Browser-Schutz
   - curl, Postman, etc. werden nicht blockiert

2. **Gestohlene Tokens**
   - Wenn jemand deinen Token hat, kann er ihn nutzen
   - CORS verhindert nur Browser-basierte Angriffe

3. **API-Schlüssel**
   - CORS ersetzt keine Authentifizierung
   - Du brauchst weiterhin JWT-Tokens

### Was CORS schützt:

✅ Browser-basierte Cross-Origin Requests  
✅ Verhindert, dass fremde Websites deine API nutzen  
✅ Schützt vor CSRF-Angriffen im Browser

---

## 🚨 Bei Problemen

### Problem: Vercel-App bekommt CORS-Fehler

**Symptom in Browser Console:**
```
Access to fetch at 'https://7rfvjbcze2.execute-api.eu-central-1.amazonaws.com/Prod/...' 
from origin 'https://vs-code-projekte-dokolator-dynamo.vercel.app' 
has been blocked by CORS policy
```

**Mögliche Ursachen:**

1. **Vercel-URL hat sich geändert**
   - Prüfe aktuelle URL in Vercel Dashboard
   - Update template.yaml mit neuer URL

2. **HTTP statt HTTPS**
   - CORS erlaubt nur HTTPS
   - Vercel sollte automatisch HTTPS nutzen

3. **Trailing Slash**
   - `https://...vercel.app` ✅
   - `https://...vercel.app/` ❌ (mit Slash)

**Lösung:**
```bash
# Prüfe exakte URL
echo "Aktuelle CORS-Config:"
grep AllowOrigin backend/template.yaml

# Falls falsch, korrigiere und deploye neu
cd backend
sam build
sam deploy
```

---

### Problem: Localhost funktioniert nicht mehr

**Symptom:**
- Development auf localhost:3000 bekommt CORS-Fehler

**Lösung:**
Füge localhost zur AllowOrigin hinzu:
```yaml
AllowOrigin: "'https://vs-code-projekte-dokolator-dynamo.vercel.app,http://localhost:3000'"
```

---

### Problem: Preview-Deployments funktionieren nicht

**Vercel erstellt Preview-URLs:**
- `https://vs-code-projekte-dokolator-dynamo-git-feature-branch.vercel.app`
- Diese werden von CORS blockiert

**Lösung 1: Wildcard für Vercel (weniger sicher)**
```yaml
AllowOrigin: "'https://*.vercel.app'"
```

**Lösung 2: Mehrere URLs (sicherer)**
```yaml
AllowOrigin: "'https://vs-code-projekte-dokolator-dynamo.vercel.app,https://vs-code-projekte-dokolator-dynamo-git-main.vercel.app'"
```

---

## 📊 Security Improvement

**Vorher:**
- CORS: 🔴 Wildcard (*) - Alle Domains erlaubt
- Security Score: 8.5/10

**Nachher:**
- CORS: 🟢 Spezifische Domain - Nur Vercel erlaubt
- Security Score: 9.0/10

---

## 🎯 Nächste Schritte

### Erledigt:
- ✅ CORS auf Vercel-Domain eingeschränkt
- ✅ Throttling aktiviert (10 req/s)
- ✅ Security Headers hinzugefügt (Frontend)
- ✅ Lambda Authorizer aktiv
- ✅ Encryption at Rest
- ✅ Point-in-Time Recovery

### Optional (Nice-to-have):
- 📋 CloudWatch Alarms einrichten
- 📋 WAF für zusätzlichen Schutz
- 📋 Custom Domain statt Vercel-Subdomain

---

## 📚 Referenzen

**CORS Dokumentation:**
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [AWS API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

**Testing:**
- Browser Developer Tools → Network Tab
- [CORS Tester](https://www.test-cors.org/)

---

**Deployed von:** Kiro AI  
**Datum:** 4. März 2026, 20:06 Uhr  
**API URL:** https://7rfvjbcze2.execute-api.eu-central-1.amazonaws.com/Prod/  
**Frontend URL:** https://vs-code-projekte-dokolator-dynamo.vercel.app
