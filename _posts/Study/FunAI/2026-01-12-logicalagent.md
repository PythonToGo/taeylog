---
title: Logical Agents
description: Summary of Logical Agents
date: 2026-01-12 05:00:00
categories: [Study, Fundamentals of Artificial Intelligence ]
author: PythonToGo
tags: [Fundamentals of Artificial Intelligence, Constraint Satisfaction Problem, Backtracking, Heuristics, Minium Remaining Values, Least Constraining Value, Arc Consistency, ]
# pin: true
math: true
mermaid: true
comments: true
image: 
#     # type: pdf
    path: assets/img/posts/study-ai/ch6-front.png

#     # page: 7
#     alt: 
---
{% include pdf-viewer.html %}

# Logical Agents

우리가 AI problem 을 setting 할때 Environments 가 항상 clear 한 것은 아니다. (당연) 그리고 자명하게 Agents 는 1인칭 시점에서 문제를 인식할 뿐, 전지적 작가시점은 아니다. 그래서 우리는 보이지 않는 부분을 위해서 logical 한 agents 를 구현하는 것이 중요하다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ai/ch7-LogicalAgents.pdf" data-page="2"></div>

## Logcical Agent


> ### Knowledge Base
>
> 공식 언어로 표현된 Sentences 의 집합 (A set of sentences in a formal language)로, 에이전트가 알고 있는 지식을 저장한다. 
>
> ### Inference Engine
>
> domain 에 독립적인 알고리즘을 사용해 기존 지식으로부터 새로운 지식을 도출하는 역할
>
> ### Knowledge Leve
>
> Agent 가 무엇을 알고 있는지를 구현 방식과 상관없이 다루는 수준, Implementation Level 은 실제 데이터 구조와 알고리즘을 다룬다. 


##  Basics of Logic

Logic 을 이해하기 위해서는 구문(Syntax), 의미론(Semantics), 모델(Model)의 개념을 알아야한다. 

- **Syntax** : 문장이 어떻게 올바르게 형성되었는지 규정한다. 
    - e.g. $$ x + y = 4$$ 는 올바르지만, $$x4y+=$$ 는 아님
- **Semantics** : 문장의 의미를 정의하며, 각 모델에 대해 문장의 `True` / `False` 를 결정한다. 
- **Model** : 문장을 True or False 로 평가하는 *Instance* 이다.
    - ** Satisfaction** : 모델 m 에서 문장 $$\alpha$$ 가 참일때, "$$m$$ 이 $$\alpha$$ 를 만족한다" 라고 하며, $$M(\alpha)$$는 $$\alpha$$ 를 만족하는 모든 모델의 집합을 의미한다. 
- **Entailment $$\alpha \models \beta$$** : 문장 $$\alpha$$ 가 True 인 모든 Model 에서 문장 $$\beta$$ 도 반드시 True 이다. $$ M(\alpha) \subseteq M(\beta)$$

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ai/ch7-LogicalAgents.pdf" data-page="3"></div>


## Propositional Logic

### Syntax and Semantics 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ai/ch7-LogicalAgents.pdf" data-page="4"></div>


> Note
>
> $$S_1 \implies S_2$$ 는 $$S_1$$ true, $$S_2$$ false 일때만 false, 나머지는 항상 true
>
> $$S_1 \iff S_2$$ 는 $$S_1 \implies S_2$$ 와 $$S_2 \implies S_1$$ 가 모두 true일때만 true
{: .prompt-tip}


### Validity and Satisfiability

- **Validity** : 모든 모델에서 true 인 문장 
    - 문장 a 가 valid 하다 => $$a \equiv \text{True}$$

- **Satisfiability** : 적어도 하나의 모델에서 true 인 문장
    - 문장 a 가 unsatisfiable 하다 => $$a \equiv \text{False}$$


<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ai/ch7-LogicalAgents.pdf" data-page="5"></div>



## Inference Methods

**Knowledge Base** 로 부터 Sentence $$\alpha$$ 가 도출되는지 ($$KB \models \alpha $$) 확인하는 방법들이다. 


### Inference by Enumeration

모든 가능한 모델을 나열해서 $$KB$$ 가 true 인 모든 경우에 $$\alpha$$ 도 true 인지 확인한다. Big O is $$O(2_n)$$.


### Theorem Proving

모델을 생성하기 않고, Inference Rules를 직접 적용한다. 
