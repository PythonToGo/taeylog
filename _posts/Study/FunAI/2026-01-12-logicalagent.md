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
    path: assets/img/posts/study-ai/ch7-re-proof.png

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

> ### Validity
>
> A sentence is valid if it is true in **all** models (e.g., $$P \lor \neg P $$). Valid sentences are also know as **tautologies**
>
> ### Satisfiability
>
> A sentences is satisfiable if it is true in **some** model. e.g., the expression $$P_1 \land P_2$$ is satisfiable for $$P_1 = P_2 = true$$, whereas $$P_1 \land \neg P_1$$ is not satisfiable.
{: .prompt-tip}

### **Modus Ponens**

$$\alpha \Rightarrow \beta$$ 와 $$\alpha$$ 가 주어지면, $$\beta$$ 를 추론한다.

> $$\frac{\alpha \Rightarrow \beta, \  \alpha}{\beta}$$

### **And-Elimination**

$$\alpha \land \beta$$ 가 주어지면 $$\alpha$$ 를 추론한다.

> $$\frac{\alpha \land \beta}{\alpha}$$

### **Logical Equivalence ($$\alpha \equiv \beta$$)**

두 문장이 동일한 모델 집합에서 true 일때 성립

![Logical Equivalence](/assets/img/posts/study-ai/ch7-logic-equivalence.png)


> ### Automated Theorem Proving
>
> The previous method was done "by hand". How can one automate this?
>
> We can use the previously introduced search methods on the following problem:
>
> - **Initial state** : the initial knowledge base
> - **Actioncs** : all the inference rules applied to all the sentences that match the top half of the inference rule
> - **Result** : the result of an action is to add the sentence in the bottom half of the inference rule
> - **Goal** : a state that contains the sentence to prove.
>
> In practical cases, finding a proof can be more efficient that enumeration because not all possible models have to be generated.
{: .prompt-info}

---

## Resolution - 해 결합 (?)

> ### Big Idea
>
> Resolution is a single, powerful inference rule that is sound and complete for propositional logic. It works via **proof by contradiction**.
>
>
> ### The Strategy
>
> To prove $$KB \models \alpha$$, we instead prove that **$$KB \land \neg \alpha$$ is unsatisfiable**.
> If $$KB \land \neg \alpha$$ leads to a logical contradiction(`False`), then our original goal ($$\alpha$$) must be `true`


Resolution 은 **Conjunctive Normal Form (CNF)** 상태의 문장들에 적용되는 complete inference algorithm 이다.

![Resolution Process](/assets/img/posts/study-ai/ch7-resolution-process.png)


### **Resolution Rule**

$$l_1 \lor ... \lor \_k \text{ 와 } l_i, m_j$$ 가 서로 complementary(보충적, e.g., $$P , \neg P$$) 일때, 이들을 제거하고 남은 literals(리터럴들)을 합친 새로운 절(Clause)을 만든다.


### **Conjunctive Normal Form**

Literals 의 논리합(Disjunction)으로 이루어진 Clauses를 Conjunction 으로 연결한 형태로, 모든 명제 논리 문장은 **CNF** 로 변환 가능하다. 


### **Proof by Contradiction**

$$KB \models \alpha$$ 임을 증명하기 위해, $$KB \land \neg \alpha$$ 가 unsatisfiable 함을 보여준다. Resolution 을 반복 적용해서 empty clause 가 나오면 증명 끝.


Resolution 에는 아주아주 유명한 예시가 있는데, superman problem 이다. 거의 모든 로직 관련 수업에 등장하는 ... 그런 예시

| Symbol |
| --- |
| A: Able, W: Willing, P: Prevents evil, |
| I: Impotent, M Malevolent, E: Exists |

| Argument | KB |
| --- | --- |
| If Superman were able and willing to prevent evil, he would do so | $$(A \land W) \Rightarrow P$$ |
| If Superman were unable to prevent evil, he would be impotent | $$\neg A \Rightarrow I $$ |
| If he were unwilling to prevent evil, he would be malevolent | $$ \neg W \Rightarrow M $$ |
| Superman does not prevent eval | $$\neg P $$ |
| If Superman exists, he is neither impotent nor malevolent | $$ E \Rightarrow (\neg I \land \neg M )$$ |
| **Therefore, Superman does not exists** | |


| --- | --- |
| **Goal** | Prove $$\neg E$$ (Superman does not exists) |
| **Proof Strategy** | We will show that $$KB \land \neg (\neg E)$$ which is $$KB \land E$$ is unsatisfiable |


#### Step 1: Converting the Knowledge Base to CNF

**Objective** : Transform the single sentence $$KB \land E$$ into a set of clauses.

**Conversion Process**

**1. Eliminate Implications ($$\Rightarrow$$)** : Replace $$\alpha \Rightarrow \beta$$ with $$\neg \lor \beta$$

**2. Move Negation ($$\neg$$) Inwards (De Morgan's)** : Replace $$\neg (\alpha \land \beta)$$ with $$\neg \alpha \lor \neg \beta$$

**3. Distribute $$\lor$$ over $$\land$$** : Replace $$\alpha \lor (\beta \land \gamma)$$ with $$(\alpha \lor \beta) \land (\alpha \lor \gamma)$$




이 방식으로 Clauses 를 정리하면 다음과 같다. 

| KB | | CNF |
| --- | --- | --- |
| $$(A \land W) \Rightarrow P$$ | **1** and **2**; $$\neg (A \land W) \lor P$$ | $$ \neg A \lor \neg W \lor P $$ |
| $$\neg A \Rightarrow I $$ | **1** | $$ A \lor I$$ |
|  $$ \neg W \Rightarrow M $$ | **1** | $$W \lor M$$ | 
| $$\neg P $$ | | $$\neg P$$ |
|  $$ E \Rightarrow (\neg I \land \neg M )$$ | **1** and **3**; $$ \neg E \lor (\neg I \land \neg M)$$ | $$(\neg E \lor \neg I) \land (\neg E \lor \neg M)$$ |

그럼 아래처럼 7가지 Clauses 가 나온다.

![The Final Set of Clauses](/assets/img/posts/study-ai/ch7-supermanclauses.png)


#### Step 2: The Resolution Proof

**Objective** : Repeatedly apply the resolution rule to derive the empty clause.

![The Resolution Proof](/assets/img/posts/study-ai/ch7-re-proof.png)

결론: The empty clause was derived, so $$KB \land E$$ is unsatisfiable. Therefore, we have proven $$KB \models \neg E$$.


## Horn Clauses and Chaining

특수한 형태의 문장인 **Horn Clause**를 사용하면 매우 효율적인 추론이 가능하다.

### Horn Clause

하나의 기호이거나, 즉 (기호들의 논리곱) $$\Rightarrow$$ 기호 형태의 문장이다.

> ### Horn Clause
>
> - proposition symbol; or
> - (conjunction of symbols) $$\Rightarrow$$ symbol
>
> A knowledge base consisting of Horn clauses only requires **Modus Ponens** as an inference method:
>
> $$\frac{\alpha_1, ... , \alpha_n, \ \alpha_1 \land ... \land \alpha_n \Rightarrow \beta}{\beta} $$
{: .prompt-info}

### Forward Chaining

Data-driven 방식으로, 알려진 사실로부터 시작해 만족되는 전제(Premises)를 찾아 결론을 추가해 나가는 방식이다. 

### Backward Chaining

Goal-driven 방식으로, 질의(Query)에서 시작해 이를 증명하기 위한 전제들을 거꾸로 찾아 올라가는 방식이다. 

![Forward and Backward Chaining](/assets/img/posts/study-ai/ch7-forward-chaining.png)


두 방식 모두 Linear 하다.


## Soundness and Completeness

| Term | Description | Expression |
| --- | ---|---|
| **Soundness** | 추론 알고리즘이 도출한 모든 문장이 실제로 유도(Entailed)되는 경우 | $$KB \models \alpha \Rightarrow KB \models \alpha |
| **Completeness** | 실제로 유도되는 모든 문장을 추론 알고리즘이 찾아낼 수 있는 경우 | $$KB \models \alpha \Rightarrow KB \vdash \alpha$$ |


<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ai/ch7-LogicalAgents.pdf" data-page="15"></div>

