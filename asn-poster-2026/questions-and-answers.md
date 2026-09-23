# ASN 2026 Poster: 50 Questions and Answers

All questions and answers were rewritten for this edition. Questions 16-50 focus on discussion (35 questions).

Audio: question once, answer twice. Flashcards: question on the front, answer on the back.

[Sources and interpretation notes](qa-sources.md)

## Study overview

### 01. What should a visitor take away from your poster?

Higher serum uric acid was associated with faster subsequent kidney function decline mainly among participants with baseline proteinuria. Proteinuria may help us interpret the prognostic meaning of uric acid, although the study does not establish causality.

### 02. What gap in the literature did you address?

The association between uric acid and kidney outcomes has been studied extensively, but the modifying role of proteinuria remains uncertain. We examined that interaction while allowing the uric acid association to be nonlinear.

### 03. What kind of population did you study?

We studied 8,266 Japanese community residents aged 20 years or older from the RIAS cohort in coastal Iwate. Their mean age was 61.7 years, and mean follow-up was 7.1 years.

### 04. How common was proteinuria, and how was it classified?

Proteinuria was present in 371 participants, or 4.5 percent. We classified a single baseline dipstick result of trace or greater as positive and also examined a stricter threshold in a sensitivity analysis.

### 05. Can you give one numerical example of the main result?

Among participants with proteinuria, the estimated GFR slopes at uric acid levels of 5.0 and 7.8 milligrams per deciliter were minus 1.27 and minus 2.04, respectively. The slope units are milliliters per minute per 1.73 square meters per year.

## Methods

### 06. How did the analysis use repeated kidney function measurements?

We fitted linear mixed-effects models with a participant-specific random intercept and random time slope. This accounts for repeated measurements within each person and allows starting kidney function and rates of change to vary between people.

### 07. Why model uric acid continuously and allow curvature?

Using a continuous exposure avoids relying on arbitrary uric acid categories. Restricted cubic splines allow the association to change shape across the observed range; our three knots were placed at the tenth, fiftieth, and ninetieth percentiles.

### 08. How did you distinguish effect modification from separate subgroup associations?

We formally tested the interaction among time, spline-transformed uric acid, and proteinuria. We did not infer interaction merely because one proteinuria group had a significant association and the other did not.

### 09. Which potential confounders were included in the model?

The model included baseline estimated GFR, age, sex, body mass index, blood pressure, diabetes, smoking, alcohol use, dyslipidemia, and disaster-related home damage or flooding. These baseline factors were included with their interactions with time.

### 10. Why did you examine these six subgroup factors?

Age and sex represent demographic characteristics; body mass index, blood pressure, and diabetes represent cardiometabolic factors; and baseline GFR represents kidney function. These were prespecified subgroup factors, with Bonferroni correction for the interaction tests.

## Reading the figures

### 11. How should I interpret the nearly flat curve without proteinuria?

Rates of decline varied little across uric acid levels, with a mean estimated GFR slope of minus 1.11 milliliters per minute per 1.73 square meters per year. Kidney function still declined; the flat exposure-response curve does not imply stable kidney function.

### 12. What does the baseline GFR subgroup actually show?

Among participants with baseline estimated GFR below 60, the proteinuria-positive group had steeper decline throughout the displayed uric acid range. This identifies a higher-risk proteinuric group; it does not show that uric acid is uniformly more harmful whenever GFR is reduced.

### 13. How much weight should we give to the subgroup P values?

Only baseline estimated GFR showed significant heterogeneity after Bonferroni correction. The other subgroup tests did not provide clear evidence of heterogeneity, but nonsignificant results do not prove that their associations are identical.

### 14. What did changing the proteinuria threshold tell you?

Using dipstick 1 plus or greater identified 146 participants and produced a similar overall pattern. This supports robustness to the definition, but the smaller group limited precision and the analysis was restricted to the overall cohort.

### 15. What do the vertical axis and shaded bands represent?

In the main figure, the vertical axis shows estimated annual GFR change, with more negative values indicating faster decline. The shaded bands are 95 percent confidence intervals for the model estimates, rather than ranges predicting each individual's future slope.

## Discussion: Mechanisms

### 16. Why might proteinuria amplify the association with uric acid?

One hypothesis is that proteinuria identifies an already injured kidney that is more susceptible to urate-related stress. Tubular inflammation could contribute, but we did not test that pathway in this cohort.

### 17. Is proteinuria itself causing injury, or marking existing damage?

Both possibilities are biologically plausible. Proteinuria can indicate existing kidney damage, and experimental protein overload can provoke tubular inflammation; our observational dipstick data cannot determine which role explains the interaction.

### 18. What is the proposed role of tubular inflammation?

Experimental studies suggest that albumin overload and urate exposure can activate inflammatory pathways in tubular cells. This provides a possible link between proteinuria and susceptibility to injury, but it is mechanistic context rather than a finding from our participants.

### 19. Does your explanation require urate crystal deposition?

No. Experimental work has investigated inflammatory responses to both soluble urate and urate crystals. Serum uric acid alone cannot tell us whether crystals were present, and our analysis did not assess crystal deposition or establish either mechanism.

### 20. Could reduced nephron reserve explain the pattern?

That is a possible explanation: kidneys with existing injury may have less capacity to tolerate additional stress. However, we did not measure nephron number or renal functional reserve, so this remains a hypothesis.

### 21. Could the association reflect shared metabolic or vascular disease?

Yes. High uric acid and proteinuria may both reflect underlying cardiometabolic disease. Adjustment for blood pressure, diabetes, and body mass index addresses some of this, but residual confounding could still explain part of the association.

### 22. Did you evaluate biomarkers that support the proposed mechanism?

This analysis did not test tubular injury or inflammatory pathways with mechanistic biomarkers. The biological explanation draws on experimental research and would need direct testing before we could claim it explains our findings.

## Discussion: Causal interpretation

### 23. Can you conclude that higher uric acid caused the faster decline?

No. Baseline uric acid preceded the measured follow-up decline, which helps establish temporal ordering, but kidney disease could already have affected uric acid at baseline. Confounding and reverse causation remain possible.

### 24. How could reverse causation operate in this cohort?

Pre-existing kidney dysfunction can reduce urate excretion and raise serum uric acid. The same underlying kidney disease can then predict subsequent decline, creating an association even without a causal effect of uric acid.

### 25. Does adjusting for baseline GFR solve reverse causation?

It helps, but cannot fully solve it. Baseline GFR is an imperfect measure of kidney health, and adjustment by GFR category leaves variation within each category; unmeasured kidney damage may still influence both uric acid and later decline.

### 26. Could proteinuria lie on the pathway from uric acid to kidney damage?

That is possible, but uric acid and proteinuria were assessed at the same baseline visit, so their temporal relationship is unclear. We examined statistical effect modification and did not perform a causal mediation analysis.

### 27. Could stratifying by proteinuria introduce bias?

Potentially. If proteinuria is influenced by uric acid and other causes of kidney decline, conditioning on it could introduce collider bias. Our findings should therefore be interpreted as conditional associations, with the underlying causal structure still uncertain.

### 28. Which unmeasured factors concern you most?

Diet, diuretic use, and renin-angiotensin system inhibitor use are important concerns because they may relate to uric acid, proteinuria, or kidney outcomes. Incomplete information on these factors and treatment changes leaves room for residual confounding.

### 29. Could changes in uric acid or proteinuria during follow-up alter the interpretation?

Yes. The analysis used baseline uric acid and proteinuria, so it cannot describe the effects of changes in either exposure. Repeated measurements would help distinguish persistent patterns from temporary findings and examine their timing.

### 30. Is a statistically significant interaction necessarily clinically important?

No. The interaction P value below 0.001 supports a difference in the modeled associations, but clinical importance depends on the size, precision, and reproducibility of that difference. Statistical significance alone does not establish a useful treatment decision.

## Discussion: Trials and clinical meaning

### 31. How do your findings fit with CKD-FIX and PERL?

Those randomized trials lowered serum urate with allopurinol but did not demonstrate kidney-function benefit in their study populations. Our association can coexist with those findings because a prognostic marker does not necessarily become an effective treatment target.

### 32. Could a proteinuria-positive subgroup explain why those trials were negative?

Our study cannot establish that explanation. CKD-FIX already included many patients with substantial albuminuria, so the presence of proteinuria alone cannot be assumed to identify a responsive subgroup. That would require a prespecified randomized comparison.

### 33. Would you prescribe urate-lowering treatment on the basis of this poster?

This poster alone would not justify that decision. We studied prognosis, not treatment response, and cannot show that lowering uric acid prevents decline in people with proteinuria. Treatment decisions require evidence relevant to the patient's clinical indication.

### 34. Should 5.0 milligrams per deciliter be considered the ideal treatment target?

No. It was near the least negative point of an observational curve, not a randomized treatment target. The location of that point is uncertain and may depend on the data and model, so it should not be used to prescribe a precise uric acid goal.

### 35. Does the lower end of the curve mean that low uric acid is harmful?

We should be cautious about that interpretation. Estimates near the exposure extremes are less precise, and factors such as nutrition or underlying illness could contribute. We cannot infer that low uric acid itself caused kidney injury.

### 36. Does the study identify a clinically useful uric acid cutoff?

No validated cutoff was established. We modeled uric acid continuously, and values such as 7.8 milligrams per deciliter illustrate the estimated curve. Choosing a decision threshold would require separate validation of its clinical performance.

### 37. Did you show that uric acid improves risk prediction beyond proteinuria and GFR?

No. An adjusted association does not establish added predictive value. We would need to compare prediction models, assess calibration and discrimination, and evaluate whether adding uric acid improves clinical decisions in an independent population.

### 38. What could change in clinical practice if the association is replicated?

It could support interpreting uric acid together with proteinuria and baseline kidney function when discussing prognosis. Before changing monitoring or treatment, however, we would need evidence that this information improves decisions and patient outcomes.

## Discussion: Limitations

### 39. How could a single dipstick measurement affect the interaction?

A single test can misclassify transient proteinuria or miss low-grade albuminuria. That could weaken or distort the estimated interaction, and its direction is not certain. Similar findings with the stricter threshold do not eliminate this limitation.

### 40. Why would quantitative albuminuria strengthen the study?

An albumin-to-creatinine ratio would allow us to examine a graded association rather than a simple positive-or-negative classification. Repeated quantitative measurements could also distinguish persistent albuminuria more reliably, although they would not remove all confounding.

### 41. Could excluding participants without follow-up bias the result?

Yes. We excluded 1,334 people without follow-up GFR data. If their likelihood of returning was related to uric acid, proteinuria, and kidney decline, selection could affect our estimates; we cannot determine the direction of that bias from this analysis.

### 42. How does the small proteinuria-positive group affect your confidence?

Only 371 participants had proteinuria, despite the large total cohort. Estimates at extreme uric acid levels and within subgroups therefore need caution; the sensitivity analysis was even smaller, with 146 positive participants.

### 43. Could factors affecting creatinine distort the estimated GFR slopes?

Yes. Creatinine-based GFR can be influenced by muscle mass and other non-GFR factors, which may change over time. Confirmation using cystatin C or measured GFR would help assess whether the pattern reflects kidney function more specifically.

### 44. Does a slower GFR slope necessarily translate into fewer kidney-failure events?

That translation was not established in this analysis. The outcome was annual GFR change, so we cannot directly estimate an effect on kidney failure, survival, or an individual patient's time to dialysis from these curves.

### 45. How transferable are these findings to other populations?

The cohort came from disaster-affected communities in one region of Japan. Differences in age, kidney disease causes, ethnicity, and health care may affect the association, so replication in other community and clinical populations is important.

### 46. Could the earthquake and tsunami have influenced the association?

They could have affected diet, stress, medication use, or access to care, potentially influencing both exposures and kidney outcomes. We adjusted for reported home damage or flooding, but that variable cannot capture every consequence of the disaster.

## Discussion: Next studies

### 47. What would be your highest-priority follow-up study?

I would prioritize replication in an independent cohort with repeated uric acid, quantitative albuminuria, and kidney function measurements. Detailed medication data would also help determine whether the interaction persists with better exposure and confounder assessment.

### 48. Which additional analyses would strengthen the observational evidence?

Useful next steps would include assessing alternative spline specifications, adjusting more flexibly for baseline GFR, and examining sensitivity to early follow-up and dropout. These are proposed checks and are not part of the reported results.

### 49. What experiment would directly test your biological hypothesis?

A controlled tubular-cell experiment could compare albumin exposure, urate exposure, and their combination while measuring injury and inflammatory responses. Soluble urate and crystals should be distinguished, and any interaction would still need confirmation in human disease.

### 50. How would you design a trial to test the treatment hypothesis?

I would prespecify proteinuria and baseline GFR strata in an adequately powered randomized trial of urate-lowering therapy. The trial would test treatment-by-proteinuria interaction and assess kidney outcomes and safety, without assuming benefit in the proteinuria-positive group.
