# Scientific references

Этот список содержит публичные научные источники, на которые можно опираться при объяснении методологического контекста проекта. Он **не является описанием точной training pipeline** и не раскрывает внутренние model artifacts EchoStressAI.

## Burnout / psychometrics

1. Schaufeli, W. B.; Desart, S.; De Witte, H. *Burnout Assessment Tool (BAT)—Development, Validity, and Reliability.* International Journal of Environmental Research and Public Health. 2020; 17(24):9495. DOI: `10.3390/ijerph17249495`.

   Почему релевантно: BAT рассматривает burnout как многокомпонентный конструкт и отделяет его от одной мгновенной эмоции. Это поддерживает осторожную трактовку voice-based signal как дополнительного наблюдаемого маркера, а не прямой замены психометрии.

2. Hadžibajramović, E.; Schaufeli, W.; De Witte, H. *A Rasch analysis of the Burnout Assessment Tool (BAT).* PLOS ONE. 2020; 15(11):e0242241. DOI: `10.1371/journal.pone.0242241`.

   Почему релевантно: дополнительная психометрическая проверка структуры BAT и его шкал.

## Acoustic voice analysis

3. Eyben, F.; Scherer, K. R.; Schuller, B. W.; Sundberg, J.; André, E.; Busso, C.; Devillers, L.; Epps, J.; Laukka, P.; Narayanan, S. S.; Truong, K. P. *The Geneva Minimalistic Acoustic Parameter Set (GeMAPS) for Voice Research and Affective Computing.* IEEE Transactions on Affective Computing. 2016; 7(2):190–202. DOI: `10.1109/TAFFC.2015.2457417`.

   Почему релевантно: стандартизированные семейства акустических признаков для анализа голоса и affective/paralinguistic задач. Публикация подчёркивает важность интерпретируемых и воспроизводимых acoustic descriptors.

4. Eyben, F.; Wöllmer, M.; Schuller, B. *openSMILE — The Munich Versatile and Fast Open-Source Audio Feature Extractor.* Proceedings of ACM Multimedia. 2010:1459–1462. DOI: `10.1145/1873951.1874246`.

   Почему релевантно: базовая публикация по openSMILE как инструменту воспроизводимого acoustic feature extraction.

## Speech representations

5. Chen, S.; Wang, C.; Chen, Z.; Wu, Y.; Liu, S.; Chen, Z.; Li, J.; Kanda, N.; Yoshioka, T.; Xiao, X.; Wu, J.; Zhou, L.; Ren, S.; Qian, Y.; Qian, Y.; Wu, J.; Zeng, M.; Yu, X.; Wei, F. *WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing.* IEEE Journal of Selected Topics in Signal Processing. 2022; 16(6):1505–1518. DOI: `10.1109/JSTSP.2022.3188113`.

   Почему релевантно: показывает подход к self-supervised speech representations, способным кодировать не только содержание речи, но и более широкий паралингвистический контекст.

## Как использовать эти ссылки корректно

Эти работы подтверждают общую научную основу:

- voice carries measurable acoustic/paralinguistic information;
- burnout — многомерный конструкт, не равный одной эмоции;
- acoustic feature families могут быть стандартизированы и интерпретируемы;
- self-supervised speech representations полезны как промежуточный representation layer.

Они **не доказывают автоматически** качество конкретной версии EchoStressAI. Performance конкретной runtime-версии должна подтверждаться отдельным validation protocol и version-specific report.
