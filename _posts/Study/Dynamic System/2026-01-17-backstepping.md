---
title: Backstepping
description: Summary of Backstepping
date: 2026-01-17 11:00:00
categories: [Study, Dynamic System]
author: PythonToGo
tags: [Dynamic System, Backstepping, Strick feedback form, Lyapunov function]
# pin: true
math: true
mermaid: true
comments: true
image: 
#     # type: pdf
    path: assets/img/posts/study-ds/ch9-front.png
# <div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch9.pdf" data-page="3"></div>
#     # page: 7
#     alt: 
---
{% include pdf-viewer.html %}

# Backstepping


Backstepping은 시스템을 작은 단위로 쪼개어 단계별로 Lyapunov function을 구축해 나가는 **Recursive** 설계 기법이다. 이 방법은 시스템을 여러개의 Subsystems 로 나눠 단계적으로 controller 를 설계하고, 최종적으로 전체 시스템을 안정화하는 *Explicit control law*를 도출한다.


이 말은 곧,

> Backstepping 조건
>
>모든 시스템에 적용할 수 없고, 반드시 **Strict feedback form**을 가진 nonlinear system 이어야한다
{: .prompt-info}


## Scope; Strict feedback form

상태 공간 모델이 다음과 같은 구조를 가질때를 말한다. 

- $$\dot{x_1} = f_1 (x) + g_1(x_1)x_2$$
- $$\dot{x_2} = f_2(x_1, x_2) + g_2(x_1, x_2)x_3$$
- ...
- $$\dot{x_i} = f_i(x_1, ... , x_i) + g_i(x_1, ..., x_i)x_{i+1} $$
- ...
- $$\dot{x_n} = f_n(x_1, ..., x_n) + g_n(x_1, ..., x_n)u$$
- 단, $$f_i(0)=0$$ 이며, 모든 $$i$$ 에 대해 $$g_i(x_1, ..., x_i) \neq 0$$ 이어야한다

이 구조의 핵심은 각 **Subsystem** 의 상태 변수 $$x_{i+1}$$ 이 바로 이전 단계의 **Pseudo control variable** 로 작동한다는 점이댜.


## Idea & Procedure

Backstepping 은 각 Subsystem 에 대해 **Virtual controller ($$\alpha_i$$)** 를 재귀적으로 설계하는 과정이다. 


> ### Procedure
>
> 1. 각 Subsystem 에 대해 Virtual controller $$\alpha_i$$ 를 설계한다.
>
> 2. 실제 state variable $$x_i$$ 와, 설계된 가상 제어기 $$\alpha_{i-1}$$ 사이의 오차를 나타내는 새로운 state variable $$z_i$$ 를 도입한다.
>
> 3. Lyapunov-based controller design (e.g., Dynamic inversion) 을 통해 각 단계에서 안정성을 보장한다.
{: .prompt-info}

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch9.pdf" data-page="3"></div>

### 1. State Transformation

실재 state variable $$x_i$$ 와 우리가 설계한 이상적인 가상의 제어값($$\alpha_{i-1}$$) 사이의오차를 나타내는새로운 변수 $$z_i$$ 를 다음과 같이 정의한다. 

- $$z_1 := x_1$$
- $$z_2 := x_2 - \alpha_1(z_1)$$
- $$z_i := x_i - \alpha_{i-1}(z_1, ... , z_{i-1})$$

#### 2. Lyapunov Function

각 단계마다 Partial Lyapunov function 을 누적해서 정의한다. 

- $$V_1 = \frac{1}{2}z_1^2$$
- $$V_i = V_{i-1} + \frac{1}{2}z_i^2$$
- Final Step: $$V_n = \frac{1}{2} \sum^n_{i=1} z_i^2$$

#### 3. Step by Step

- **Step 1** : $$\dot{x_1}$$ 식에서 $$x_2$$ 를 제어의 입력으로 보고, $$\dot{V_1} \leq 0$$ 을 만족시키는 Virtual controller $$x_2 = \alpha_1(z_1)$$ 를 설계한다.
- **Step $$i$$** : $$x{i+1}$$ 을 Pseudo control variable 로 사용해,  $$\dot{V_i} \leq 0$$ 이 되도록 $$\alpha_i (z_1, ..., z_i)$$ 를 설계한다.
- **Step $$n$$** : 실제 제어 입력 $$u$$ 가 나타나는 단계로, $$u = \tilde{u}(z_1, ..., z_n)$$ 을 결정한 후, 다시 원래의 좌표 $$x$$ 로 Transform back 해서 최종 제어 법칙 $$u(x_1, ..., x_n)$$ 을 얻는다. 


#### Example

3rd- Order System 이 다음과 같다.

![3rd Order system](/assets/img/posts/study-ds/ch9-3rd.png)

- **Objective** : Global stabilization of the origin $$x=0$$.
- **Strategy** :
  - 1. Use $$x_2$$ to stabilize $$x_1$$
  - 2. Use $$x_3$$ to stabilize $$x_2$$
  - 3. Use $$u$$ to stabilize $$x_3$$


**Step 1**

For $$V_1 = \frac{1}{2} z_1^2, \dot{V_1} = z_1(z_1^2 - z_1^3 + x_2)$$
  -> $$x_2$$ 의 목표값이 virtual controller $$\alpha_1 = z_1^3 - z_1^2 - z_1$$ 로 선택하면, $$\dot{V_1} = -z_1^2$$ 이 되어 안정화된다.

**Step 2**

After adding $$z_2 = x_1 - \alpha_1$$, V_2 = V_1 + \frac{1}{2}z_2^2$$
  -> $$\dot{V_2} = -z_1^2 + z_2(x_3 +z_1 - (3 z_1^2 - 2z_1 -1)(z_2 - z_1))$$ 이며, 이를 안정화하는 $$\alpha_2 = -z_1 - z_2 + (3 z_1^2 - 2z_1 -1)(z_2 - z_1)$$ 를 설계한다. 

**Step 3**

마지막으로 실제 입력 $$u$$ 를 포함한 $$\dot{V_3}$$ 을 분석.


---

## Robust Backstepping and ISS

실제 시스템에는 외부 Disturbance($$\delta$$)가 존재할 수 있다. **Robust Backstepping** 은 이런 불확실성에도 시스템의 안정성을 보장한다. 


<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch9.pdf" data-page="12"></div>

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch9.pdf" data-page="13"></div>


### Input-to-State Stability (ISS)

bounded Disturbance($$\lvert \delta \rvert \leq \delta_{max}$$) 가 존재할때, 상태 $$z$$ 가 무한히 커지지 않고 특정 영역 ($$\rho(\delta_{max})$$) 내에 머무르게한다.


### E.g.

System $$\dot{V_2} \leq - k_0 (z_1^2 + z_2^2) + \frac{\delta^2}{2}$$ 같은 부등식을 유도하면서 Lyapunov function 이 특정 반경 밖에서는 항상 감소함을 증명해 ISS 성질을 확보한다. 



## 결론.

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch9.pdf" data-page="15"></div>
