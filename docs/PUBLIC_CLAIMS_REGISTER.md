# Public Claims Register · EchoStressAI GPB TechLab 2026

Этот документ фиксирует **какие формулировки допустимы во внешней коммуникации проекта**, а какие создают ложное впечатление о качестве, вероятности, причинности или степени готовности решения.

Он предназначен для README, презентации, demo, устной защиты и ответов на вопросы жюри.

## 1. Общий принцип

Публичный claim должен одновременно соответствовать:

```text
конкретной model/runtime версии
+ фактическому validation protocol
+ правильной единице наблюдения
+ корректной семантике score
+ известным ограничениям
```

Если одно из этих условий отсутствует, формулировку нужно ослабить.

---

# CASE 1

## 2. Допустимые claims

Корректно:

> «Финальная bank-safe PRIMARY-модель анализирует клиентскую сторону в раннем окне до 60 секунд».

> «На зафиксированном labeled protocol CLIENT-only PRIMARY показывает PR AUC 0.3654, ROC AUC 0.7569 и weighted F1 0.8190».

> «Недостаток клиентской речи обрабатывается отдельным outcome `insufficient evidence`, а не автоматически как низкий риск».

> «Operator-side сигнал исследовался, но не используется как финальный клиентский production claim из-за workflow-shortcut риска».

> «Отдельная privileged-learning ветка дала более сильный R&D result, но не является текущим production claim».

## 3. Недопустимые claims CASE 1

Не говорить:

> «PR AUC 0.924 по клиенту».

Почему: высокая метрика относится к operator/protected teacher context, а не к финальному CLIENT-only PRIMARY.

Не говорить:

> «Score 0.82 = 82% вероятность воздействия мошенника».

Почему: текущий score не должен называться calibrated probability без отдельного calibration evidence.

Не говорить:

> «CONTROL подтвердил AUC».

Почему: истинные labels CONTROL60 команде неизвестны.

Не говорить:

> «LUPI вообще не использует оператора».

Почему: operator/context information может использоваться offline на teacher/training stage; CLIENT-only ограничение относится к финальному student inference vector.

Не говорить:

> «Низкий score означает, что клиент точно не под воздействием».

Почему: отдельно существует sufficiency/evidence condition.

---

# CASE 2

## 4. Допустимые claims

Корректно:

> «Frozen CASE 2 PRIMARY — `CASE2_OPEN_ACOUSTIC11_ORIENTED_V1`».

> «В текущем competition validation snapshot Period ROC AUC = 0.8701, Period PR AUC = 0.8060, operator-equal ROC ≈ 0.882».

> «Acoustic11 выбран вместо fusion, потому что fusion дал лишь около +0.0065 ROC AUC при дополнительной ASR/text complexity».

> «CASE 2 score — относительный model risk/state signal, а не медицинский диагноз и не калиброванная вероятность выгорания».

> «Один звонок даёт предварительный речевой сигнал; более сильная интерпретация относится к employee-period / series-of-calls setting».

> «Within-person динамика остаётся отдельным ограничением текущей модели».

## 5. Недопустимые claims CASE 2

Не говорить:

> «0.57 = 57% вероятность выгорания».

Почему: score является relative/ranking signal, а не calibrated probability.

Не говорить:

> «Один звонок показывает, что сотрудник выгорел».

Почему: burnout — устойчивый construct; текущая модель не является медицинской диагностикой по одному разговору.

Не говорить:

> «25 TRAIN periods — популяционная норма».

Почему: это текущая relative reference, а не нормативная популяционная шкала.

Не говорить:

> «ROC AUC 0.87 окончательно доказан как production performance Банка».

Почему: это текущий конкурсный/internal validation result; для более сильного внешнего claim требуется дополнительный audit/validation конкретного release.

Не говорить:

> «CONTROL подтвердил качество 0.87».

Почему: CONTROL не использовался для model selection и не превращается автоматически во внешний labeled test.

---

# Explainability

## 6. Допустимый claim

Корректно:

> «Интерфейс показывает объясняющие факторы/семантические группы и ограничения результата».

> «Для критерия explainability ≥80% подготовлен отдельный human-acceptance protocol».

## 7. Пока нельзя говорить

> «Требование объяснимости ≥80% выполнено».

до получения результата по заранее зафиксированному human-acceptance protocol.

Наличие XAI payload или feature chart само по себе не является 80% human explainability.

---

# Resource / deployment

## 8. Допустимые claims

Корректно:

> «Архитектура on-prem-ready: обязательный inference path может быть локальным».

> «Public integration layer контейнеризован».

> «Ресурсный профиль конкретного connected runtime проверяется отдельно».

## 9. Пока нельзя говорить без benchmark

> «Всё решение гарантированно укладывается в 1×A100».

> «CASE 1 всегда обрабатывается за N секунд».

> «CASE 2 всегда обрабатывается за N секунд».

Пока это не подтверждено benchmark конкретного release/container/runtime snapshot.

---

# Business claims

## 10. Экономический эффект

Внутренний расчёт порядка `640.4 млн ₽/год` относится к **модельному сценарию полной мощности**, а не к доказанному фактическому эффекту пилота.

Допустимо:

> «В модельном business-case сценарии потенциальный эффект оценивается до 640.4 млн ₽/год при заданных предпосылках».

Недопустимо:

> «EchoStressAI уже экономит Банку 640.4 млн ₽/год».

или

> «Экономический эффект 640.4 млн ₽ доказан».

Для доказанного эффекта нужны реальные pilot metrics: additional detection, false escalation, verification time, prevented fraud loss и/или downstream HR/quality metrics.

---

# Expert validation

## 11. Допустимая формулировка

> «Экспертная рецензия использовалась для анализа construct validity, temporal mismatch и классов ошибок».

## 12. Недопустимая формулировка

> «Эксперты подтвердили construct».

Текущая human validation показала ограниченное agreement, поэтому expert review является источником содержательной проверки и ограничений, а не доказательством идеальной ground truth.

---

# Public repo / IP

## 13. Допустимые claims

> «Public repo содержит проверяемый integration/UI code, contracts, tests и документацию».

> «Model weights и proprietary formulas могут поставляться/подключаться отдельно как local runtime».

> «Отсутствие weights в public Git не означает использование сохранённых результатов вместо inference».

## 14. Что не обещать

Не говорить:

> «Public Git полностью воспроизводит обучение и full proprietary model stack».

Если training code/weights intentionally private, корректно говорить о **public integration reproducibility** и отдельно о **connected-runtime inference reproducibility**.

---

# 15. Быстрый pre-demo checklist для формулировок

Перед публикацией числа спросить:

1. Какая это model version?
2. На каком split/protocol получено?
3. Это call-level или employee-period?
4. Это probability или ranking score?
5. CONTROL labels известны?
6. Это PRIMARY или R&D/supporting branch?
7. Есть ли caveat, который должен стоять рядом?
8. Не раскрывает ли claim proprietary implementation detail?

Если ответ на один из вопросов неизвестен — claim нужно сделать осторожнее.

## 16. Итог

Главное правило внешней коммуникации EchoStressAI:

> **Лучше более скромный, но воспроизводимый и корректно интерпретируемый claim, чем более высокая цифра, полученная на shortcut, другой единице наблюдения или без необходимой ground truth.**