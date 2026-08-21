# Land-art Space — integration details for 360 Finance

**Merchant:** LANDART · Shambala Carbon Offsets LLC
**Environment:** production — `https://api.minu.mn/oncom`
**Contact:** hello@shambala.today
**Reference format:** `LA-XXXXXXXX-XXXXXXXX` (uppercase, letters, digits, hyphens)

---

## 1. Callback — transaction response (document section 5)

```
https://www.land-art.space/api/pay-callback
```

- **Method:** POST, `Content-Type: application/json`
- **Sent on:** every completed transaction, card and QR alike
- **Response:** HTTP 200 with `{"status":"000","message":"Success","entity":null}`
- **Retries:** safe. The same reference may be sent any number of times; it is
  recorded once.

### The query string must be preserved

This address is supplied on every `/invoice` request in the `webhook` field, and
it carries a secret:

```
https://www.land-art.space/api/pay-callback?k=<48-character key>
```

**Please call the address exactly as it appears on the invoice, query string
included.** The key is how the endpoint knows the call is genuine; a request
without it is answered `401` and the payment is not recorded.

HTTP Basic Auth is also accepted as an alternative, if that suits your system
better. Credentials on request.

---

## 2. Redirect — payment response (document section 6)

```
https://www.land-art.space/api/pay-return
```

- **Method:** GET redirect, in the buyer's browser
- Supplied on every `/invoice` request in the `redirectUtl` field, as
  `https://www.land-art.space/api/pay-return?ref=LA-...`

This endpoint accepts the result appended in any of the forms in circulation —
`?referenceNumber=…&status=success&code=200`, the same parameters after a
slash, or with `&` onto the existing query — and redirects the buyer to a
confirmation page.

---

## 3. Please use `www.`

Both addresses must keep the `www.` prefix.

`land-art.space` without it answers every request with a **308 redirect** to
`www.land-art.space`. A browser follows that silently, but a server-side HTTP
client will often refuse to follow a redirect on POST, or follow it having
dropped the request body. A callback sent to the apex will not arrive.

---

## 4. Questions

1. **Is the callback in section 5 sent for card transactions, or only for QR?**
   We have a completed card payment for which no callback reached us.

2. **Was a callback attempted for the transactions below?** If so, what response
   did our endpoint return?

   | Date | Cell | Pits | Amount |
   |---|---|---|---|
   | 2026-08-21 | F-01 | 3 | — |
   | 2026-08-21 | F-12 | 1 | — |

   *(references available on request)*

3. **`checkTxn` — which identifier does it expect?**
   `POST /checkTxn/{merchantCode}/{referenceNumber}` returns
   `003 — Инвойс олдсонгүй` for invoices raised minutes earlier under the same
   merchant code, whose hosted pages render and are payable.

4. **Is the merchant code we hold the production one?** Invoices are created
   successfully against `/oncom`, and we would like that confirmed rather than
   assumed.

5. **Invoice validity — how long does a hosted invoice remain payable?**

---

## 5. Note on the hosted invoice page

`api.minu.mn/oncom/invoice` has no `<!DOCTYPE html>`, so browsers render it in
Quirks Mode and warn in the console. It does not affect payment; passing it on
in case it is useful.
