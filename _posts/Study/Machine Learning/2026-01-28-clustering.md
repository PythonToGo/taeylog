---
title: Clustering
description: Summary of Clustering
date: 2026-01-28 09:00:00
categories: [Study, Machine Learning]
author: PythonToGo
tags: [Machine Learning,Clustering, Unsupervised Learning, Expectation Maximization Algorithm]
# pin: true
math: true
mermaid: true
comments: true
image: 
    path: assets/img/posts/study-ml/ch12-front.png
#     alt: <div class="pdf-viewer-container" data-pdf="" data-page="2"></div>
---
{% include pdf-viewer.html %}

# Clustering

> **K-means**는 hard assignment 방식의 거리 기반 클러스터링인 반면, **GMM (Gaussian Mixture Model)**은  **EM algorithm (Expectation Maximization)** 을 활용한 soft assignment 방식의 확률적인 모델이다. 데이터의 트것ㅇ과 목적에 따라 단순한 거리 기반 알고리즘이나 복잡한 확률적 접근법을 다르게 선택하자. 



## Introduction

**Clustering** 은 라벨이 없는 데이터 $$\{ x_i\} 에서 **latent space (잠재적인 구조)** 를 발견하는 Unsupervised learning 비지도학습의 방법 중 하나이다. 보통 Image segmentation, User profiling, Gene expression analysis, Data compression, Visualizing 등이 있다.

> ### Goal
>
> 객체들을 K개의 그룹으로 묶되, 같은 그룹 내의 객체들은 similar(유사하게), 서로 다른 그룹의 객체들은 dissimilar(이질적?다르게?) 만드는 것이 목표. 즉 편가르기를 하겠다~ 이말.

### Assignment

각 객체 $$x_i$$ 에 대해 K개 그룹 중 하나를 가리키는 할당값 $$z_i \in \{ 1, ..., K\}$$ 를 찾늗다.

## Distance-based Clustering: K-means & K-medians

유사성을 정의하기 위해 **Similarity function $$s(\cdot, \cdot)$$** 이나 **Distance function $$d(\cdot, \cdot)$$** 을 사용한다. 

### K-means Algorithm

각 클러스터는 **Centroid** $$\mu_k \in \mathbf{R}^D$$ 로 정의되고, 클러스터 지표 $$z_i \in \{ 0, 1\}^K$$ 는 **One-hot encoding(!)** 방식을 따른다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="2"></div>

### Distortion measure

$$
J(X, Z, \mu) = \sum^N_{i=1} \sum^K_{k=1} z_{ik} ||x_i - \mu_k||^2_2
$$


위 식을 최소화하는 $$Z, \mu$$ 를 찾는것이 목적이다. 그럼 이것을 어떻게 찾는냐? 할때 로이드 알고리즘이라는 것이 등장한다.


### **Lloyd's Algorithm**

다음 두 단계를 수렴할 때까지 반복하는 *Alternating optimization* 방식이다.

#### 1. Update Z 

각 $$x_i$$ 를 가장 가까운 $$\mu_k$$ 에 할당한다. 

$$
z_{ik} = 1 \text{ if } k = argmin_j ||x_i - \mu_j||_2 \text{ else } 0
$$

#### 2. Update $$\mu$$

할당된 점들의 평균으로 Centroid 를 갱신한다.

$$ 
\mu_k = \frac{1}{N_k} \sum^N_{i=1} z_{ik} x_i
$$

이 방법은 **초기값에 매우 민감**하기 때문에, 첫 번째 중심을 무작위로 선택한 후 거리의 제곱에 비례하는 확률로 다음 중심을 뽑는 K-means++ 알고리즘이 권장된다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="10"></div>

## Gaussian Mixture Model (GMM)

K-means 는 거리 기반으로 나눈다. 여기서 약간의 문제점! 이 발생하는데, 대충  거리로 때려서 나누면, 어떤 값들은 확실하지 않거나, 오분류가 되거나, 혹은 특이케이스가 너무 큰 값을 차지해 클러스터링에 문제가 생길 수도 있다. 그래서 이를 극복하기 위해 확률적인 모델인 GMM 을 도입하게 되었다. 

GMM 은 데이터가 여러 개의 가우시안 분포가 혼합된 형태 라고 가정하고, **Latent variables $$Z$$** 를 통해 이를 모델링한다. 

~~결국 그냥 확률의 합~~

-**Joint Probability** : $$ p(x, z \lvert \theta) = p(x \lvert z, \theta) p(z \lvert \theta)$$
  - **Cluster Prior** : $$p(z \lvert \theta) = Cat(\pi)$$ , Categorical distribution
  - **Conditional Likelihood** : $$ p(x \lvert z_k = 1, \theta)= \mathcal{N}(x \lvert \mu_k, \sum_k)$$


위 식과 같은 내용인데, 기댓값과 공분산의 성질을 다시 보면 아래와 같다 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="3"></div>


-**Marginal Likelihood** : $$p(x \lvert \pi, \mu \Sigma) = \sum^K_{k=1} \pi_k \mathcal{N}(x \lvert \mu_k, \sum_k)$$


여기 이제 inference(Responsibility) 가 등장하는데, 이것은 파라미터가 주어졌을 때 데이터 $$x_i$$가 클러스터 k 에서 나왔을 사후 확률이라고 한다. 


$$
\gamma(z_{ik}) = \frac{\pi_k \mathcal{N} (x_i \lvert \mu_k, \sum_k)}{\sum^K_{j=1} \pi_j \mathcal{N} (x_i \lvert \mu_j, \sum_j)}
$$


## Expectation-Maximization (EM) Algorithm

**GMM** 의 로그 가능도 함수인 $$log p(X \lvert \theta)$$ 는 로그 안에 합이 있어 직접 최적화가 어렵기 때문에, **EM Algorithm** 을 사용한다. 이것은 E-step, M-step 의 합성으로 평가하고 업데이트하고.. 의 반복 이다. 

### E-step

현재 파라미터를 바탕으로 Responsibility $$\gamma_t(Z)$$ 를 평가한다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="4"></div>


### M-step

Expected joint log-likelihood 를 최대화해서 파라미터를 업데이트한다. 

- $$\mu^{(t+1)}_k = \frac{1}{N_k} \sum^N_{i=1} \gamma_t (z_{ik}) x_i$$

- $$\sum^{(t+1)}_k = \frac{1}{N_k} \sum^N_{i=1} \gamma_t (z_{ik}) (x_i - \mu_k^{(t+1)})  (x_i - \mu_k^{(t+1)})^T$$

- $$\pi_k^{(t+1)} = \frac{N_k}{N} \text{ 단, } N_k = \sum^N_{i=1} \gamma_t (z_{ik})$$


<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="5"></div>

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="6"></div>

### General EM

임의의 확률 분포 $$q(Z)$$ 에 대해 하한선인 $$L(q, \theta)$$ 를 정의하고, E-step 에서는 $$q(Z)$$ 를 사후확률에 맞춰 하한선을 높이고(**tighten), M-step 에서는 $$\theta$$ 에 대해 이 하한선을 최대화 한다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="6"></div>

## Advanced Topics,,,

### **Mixture of Bernoullis**

binary data(e.g., 흑백이미지) 를 모델링할 대 사용하고, M-step 을 업데이트할 때, 각 픽셀 $$d$$의 확률 $$\theta_{kd}$$은 **Responsibility**로 가중 평균된 픽셀 값들의 평균이 된다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="7"></div>

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="8"></div>

### **K-menas vs. GMM**
모든 가우시안 성분의 공분산이 $$\sum_k = \sigma^2 I \text{ 이고 } \sigma^2 \rightarrow 0$$ 일 때,
  - GMM 의 EM update == K-mean 의 Lloyd's algorithm


두 개가 동일해진다. 

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="9"></div>

### **How to choose $$k$$?**

| method | sorts |
|---|---|
| Heuristic | Elbow method |
| Heuristic | Gap statistic| 
| Heuristic | Silhouette |
|  |  |
| Probabilistic | **BIC**,  $$M log N - 2 log \hat{L}$$ |
| Probabilistic | **AIC**,  $$2 M - 2 log \hat{L}$$ |


### **Hierarchical Clustering**

데이터를 계층적으로 쌓아가는 방식

- **Agglomerative** : Botton-up 방식으로 클러스터 쌍을 병합
- **Linkage criteria** : 클러스터 간의 거리를 정의하는 기준 (single, complete, average, centroid 등) 에 따라 병합 대상이 결정됨


## 결론

<div class="pdf-viewer-container" data-pdf="/assets/img/posts/study-ml/ch12.pdf" data-page="12"></div>
