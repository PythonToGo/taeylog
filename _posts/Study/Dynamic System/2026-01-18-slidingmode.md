---
title: Sliding Mode
description: Summary of BaSliding Modeckstepping
date: 2026-01-18 10:00:00
categories: [Study, Dynamic System]
author: PythonToGo
tags: [Dynamic System, Sliding Mode, Switching controller]
# pin: true
math: true
mermaid: true
comments: true
image: 
#     # type: pdf
    path: assets/img/posts/study-ds/ch10-front.png
# <div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch9.pdf" data-page="3"></div>
#     # page: 7
#     alt: 
---
{% include pdf-viewer.html %}

# Sliding Mode Control

Sliding Mode Control 은 불연속적인 **Switching controller** 를 이용해서 시스템의 상태를 특정한 평면으로 강제 유도하고, 그 위에서 미끄러지듯 움직이게 해서 목표 지점에 도달하게 하는 제어기법이다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="2"></div>

## Sliding Mode Principle

System 은 대개 불확실성이나 disturbance $$d$$ 를 포함하는 nonlinear 형태로 모델링한다. 

$$
\dot{x} = f(x, u) + d(x, t)
$$

그리고 Switching Manifold 가 정의되는데, 제어목표가 되는 상태 공간산의 평면/곡면이다. 그냥 goal 이라고 보면 됨.

$$
S = \{ x \in \mathbb{R}^n \lvert s(x) = 0 \}
$$


결과적으로 우리의 목표는

### Goal 

- **1. Approaching Phase** : 임의의 초기 상태에서, *Finite time* 내에 **Switching manifold** 에 도달하게 한다.
- **2. Sliding Mode** : 일단 평면에 도달하면, 그 위에서 벗어나지 않고 목표상태로 수렴한다.


> ### Goal
>
> 1. Reach manifold $$S$$ in finite time
>
> 2. Once reached, remain on manifold $$S$$ ( thus, $$s(x)= 0$$ )
{: .prompt-info}


## General Structure

평면 $$s(x)$$ 의 부호에 따라 제어 입력을 급격히 바꾸는 **불연속 제어기** 를 사용한다.

- $$ u(x) = u^{+}(x) \text{ for } s(x) > 0$$
- $$ u(x) = u^{-}(x) \text{ for } s(x) < 0$$

예시로, 가장 단순한 형태는 $$u = -sign(s(x))$$ 같은 *Signum functionm* 이 있다. 

![u = -sign(s)](/assets/img/posts/study-ds/ch10-sign.png)

### Characteristics of Sliding Mode

- **Robustness** : Disturbance $$d(x,t)$$ 가 제어 입력과 같은채널을 통해 들어오는 **Matching condition**을 만족할 경우, 시스템은 모델 불확실성에 대해 매우 강인한 특성을 보인다. 

- **Order Reduction** : System 이 Sliding mode 에 진입하면, 시스템의 차수가 원래의 $$n$$ 에서 $$n-m$$ 으로 줄어드는 효과가 있다. 

- **Chattering** : 실제 하드웨어의 유한한 스위칭속도로 인해 평면 근처에서 발생하는 고주파 진동현상, actuator 의 마모를 유발할 수 있다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="3"></div>


## Existence of Sliding Mode

> For simplicity, let us consider $$s(\cdot) : \mathbb{R}^n \rightarrow \mathbb{R} \text{ and } u \in \mathbb{R}$$

우리는 $$S$$ 가 finite time 에 도달함을 증명해야한다.  그러니까 여기서 Lyapunov function 의 개념이 다시 나온다. 즉, 

---

For given $$s(x) \in \mathbb{R}$$ , define Lyapunov function $$V = \frac{1}{2}s^2$$. Then,

- **Option 1** : Check if $$\dot{V} = s \dot{s}$$ is **ndf** AND $$s \dot{s} \leq - \eta \lvert s \rvert $$ , for some $$ \eta > 0$$.

- **Option 2** : Check if $$\dot{V} = s\dot{s}$$ is **ndf** AND local conditions:


|  |  |
|---|---|
|  $$ s \dot{s} < 0 \text{ for } s \neq 0$$ | $$s < 0 \iff \dot{s} > 0$$ |
|   | $$s > 0 \iff \dot{s} < 0$$ |
| | |
| Local conditions |  $$\displaystyle{ \lim_{s \to 0^{-}} \dot{s} > 0 }$$ |
|                  |  $$\displaystyle{ \lim_{s \to 0^{-}} \dot{s} < 0 } $$|


## Stability of Ideal Sliding Mode

Ideal Sliding Mode 란, **$$s=0$$ AND $$\dot{s}=0$$** 을 뜻한다. 이 상태에서 시스템이 어떻게 행동하는지를 분석하기 위해 두 가지 방법이 있다. 

### 1. Filippov's Method

평면 경계에서의 두 벡터 필드 $$f^{+} \text{ 와 } f^{-}$$ 의 **Convex hull** 로 해를 정의한다.

$$
\begin{aligned}
\dot{x}_{fi} = \alpha f^{+}(x_{fi}) + (1 - \alpha)f^{-}(x_{fi}) \\
 \\
0 \leq \alpha \leq 1 \iff \alpha = \frac{\frac{\partial s}{\partial x} f^{-} (x)}{\frac{\partial s}{\partial x}(f^{-}(x) - f^{+}(x))}
\end{aligned}
$$

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="9"></div>

### 2. Equivalent Control Method

시스템을 평면 위에 유지시키기 위해 필요한 가상의 연속 제어 입력 $$u_{eq}$$ 를 도출하는 방식이다. 

$$
\begin{aligned}

\text{ for } \dot{x} = f(x) + G(x)u : \\

\text{ find } u_{eq} \text{ such that } s(x) = 0 \text{ and } \dot{s}(x) = 0 . \\
 \\
\implies \dot{x}_{eq} = f(x_{eq}) + G(x_{eq}) u_{eq} \\
\text{ and } u_{eq} = - \bigg( \frac{\partial s(x)}{\partial x} G(x) \bigg)^{-1} L_f s(x)
\end{aligned}
$$


## Example: Linear Oscillator

선형 발진기에서는, $$s = x_1 + k x_2$$ 형태의 Switching line 을 설정해서 분석한다.

파라미터 $$k$$ 의 값에 따라, 시스템은 **Nonlinear continuous oscillation ($$k=0$$), Unstable movement ($$k <0$$), or Convergence to EP ($$k >0$$)** 등의 형태를 가진다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="10"></div>

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="11"></div>


## Continuous Approximation

Chattering 을 억제하기 위해 Signum function 대신 **Continuous approximation**  을 사용하기도 한다. 

![Continuous Approximation](/assets/img/posts/study-ds/ch10-contapp.png)

특정 경계층($$\epsilon$$) 내에서 제어의 입력을 linear 하게 만드는 방법으로

$$
u(x) = -K sat \bigg( \frac{s(x)}{\epsilon} \bigg)
$$

이 형태를 따른다. 이렇게 되면, 

- Region $$ \lvert s \rvert > \epsilon : u = -K $$ - Reaching Phase
- Region $$ \lvert s \rvert \leq \epsilon : u = - \frac{K}{\epsilon} s$$ - Linear High-Gain


이렇게 두 가지로 나눌 수 있다.  이 방식은 Chattering 을 줄여주지만, 상태를 $$s=0$$ 에 완전히 고정시키는 대신 평면 근처의 일정한 Neighborhood 내로 수렴시키는 특성을 가진다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="13"></div>

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="14"></div>


## 결론

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ds/ch10.pdf" data-page="15"></div>
