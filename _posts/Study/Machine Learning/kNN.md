---
title: k-Nearest Neighbors Algorithm and Decision Tree
description: Summary of k-Nearest Neighbors and Decision Tree
date: 2025-12-27
categories: [Study, Machine Learning]
tags: [Machine Learning, kNN, Decision Tree]
pin: true
math: true
mermaid: true
comments: true
# image: 
#     path: 
#     lqip: 
#     alt: 
---

# k-Nearest Neighbors

## 기본 개념

k-Nearest Neighbors (kNN)은 새로운 샘플을 분류할 때, 주변 이웃들의 정보를 확인하여 라벨을 결정하는 직관적인 방식입니다. **"Do as your neighbor does - 이웃이 하는 대로 따라 하라."**는 원리

### 1-NN Algorithm

가장 가까운 단 하나의 이웃을 찾아 그 라벨을 부여한다. 이는 **Voronoi tessellation** 형성, 종종 generalization 능력이 떨어지기도 한다.

### k-NN Classification

Training set의 노이즈에 더 robust하게 만들기 위해 k개의 가장 가까운 이웃을 보고 **Majority label**을 선택.

---

## Definition 

### Classification Probability

클래스 $$c$$에 속할 확률은:

$$
p(y=c|x,k) = \frac{1}{k} \sum_{i \in N_k(x)} I(y_i = c)
$$

여기서 $$I(e)$$는 **Indicator variable**로, $$e$$가 true이면 1, false이면 0이다.
최종 예측값 $$\hat{y}$$은 :

$$
\hat{y} = \arg\max_c p(y=c|x, k)
$$

### Weighted k-NN

이웃과의 거리에 반비례하여 가중치를 주는 방법:

$$
p(y=c|x, k) = \frac{1}{Z} \sum_{i \in N_k(x)} \frac{1}{d(x, x_i)} I(y_i = c)
$$

여기서 $$Z = \sum_{i \in N_k(x)} \frac{1}{d(x, x_i)}$$는 **Normalization constant**이다.

### k-NN Regression

실숫값 $$y_i$$를 예측하며, 이웃들의 가중 평균 사용:

$$
\hat{y} = \frac{1}{Z} \sum_{i \in N_k(x)} \frac{1}{d(x, x_i)} y_i
$$

---

## Hyper-parameter Tuning 및 Model Selection

### Hyper-parameter

$$k$$는 모델이 스스로 학습하는 것이 아니라 사용자가 정하는 값.

### Data Splitting

최적의 $$k$$를 찾기 위해 데이터를 다음과 같이 나눠짐:

- **Training set**: 모델 학습에 사용
- **Validation set**: 다양한 $$k$$값에 대한 성능을 평가해 최적의 $$k$$를 선택
- **Test set**: 최종 선택된 모델의 성능을 보고하기 위해 단 한 번만 사용

### k 선택의 특성

$$k$$가 전체 데이터 개수 $$N$$과 같아지면, 거리와 상관없이 항상 데이터셋 내의 **Majority class**로만 예측하게 된다

---

## Classification Performance 측정지표

**Confusion table**을 기반 지표:

- **Accuracy**: $$acc = \frac{TP + TN}{TP + TN + FP + FN}$$
- **Precision**: $$prec = \frac{TP}{TP + FP}$$
- **Sensitivity/Recall**: $$rec = \frac{TP}{TP + FN}$$
- **F1-Score**: $$f1 = \frac{2 \cdot prec \cdot rec}{prec + rec}$$

> ⚠️ **주의**: Imbalanced classes인 경우 지표 선택에 주의해야함!

---

## Distance Measures (거리 측정법)

k-NN은 거리 측정 방식에 따라 결과가 달라질 수 있다.

### Distance measurement method 

- **Euclidean distance (L2 Norm)**: 
  $$d_2(u, v) = \sqrt{\sum_i (u_i - v_i)^2}$$

- **Manhattan distance (L1 Norm)**: 
  $$d_1(u, v) = \sum_i |u_i - v_i|$$

- **L∞ norm**: 
  $$d_\infty(u, v) = \max_i |u_i - v_i|$$

- **Mahalanobis distance**: 
  $$d_M(u, v) = \sqrt{(u - v)^T \Sigma^{-1} (u - v)}$$

### 거리 측정법 간의 관계

$$d_2(x,y) \leq d_1(x,y)$$ 관계가 항상 성립하나, L1에서 가장 가까운 이웃이 L2에서도 반드시 가장 가까운 이웃인 것은 아니다.

---

## Scaling Issues 및 Solution

### Problem

각 Features의 **Scale**(단위)가 다르면, 특정 Feature가 거리에 과도한 영향을 미칠 수 있다.

### Data Standardization

각 Features를 평균 0, 분산 1로 변환:

$$
x_{i, std} = \frac{x_i - \mu_i}{\sigma_i}
$$

### 대안

**Mahalanobis distance**를 사용하는 것도 스케일 문제를 해결하는 방법 중 하나이다.

---

## Curse of Dimensionality

- 차원이 높아질수록 데이터가 입력 공간을 덮는 비율이 급격히 감소한다..
- 이로 인해 Nearest neighbor가 매우 멀어지게 되고, 성능 유지를 위해서는 데이터 개수 $$N$$이 Feature 수에 따라 기하급수적으로 늘어나야 한다.

---

## Practical Considerations

### Complexity

나이브한 방식의 인퍼런스는 Memory와 Inference 시간 모두 $$O(N)$$이 소요되고 이는 곧 고비용을 뜻함.

### Solution

효율적인 검색을 위해 **k-d tree**와 같은 트리 기반 검색 구조를 더 알아보자.

---

## 결론

k-NN은 동네 투표와 같다. 새로운 사람이 이사를 왔을 때(새 데이터), 그 사람이 어떤 사람인지(라벨)를 주변에 사는 가장 가까운 이웃 $$k$$명에게 물어봐서 다수결로 결정하는 것에 비유할 수 있다. 그런데 이때 동네가 너무 넓어지면(차원의 저주) 가장 가깝다고 하는 이웃조차 사실은 아주 멀리 살고 있어 그 사람에 대해 정확히 알기 어려워진다. 


---

# Decision Tree

## Fundamental Concept

### Intuition

"20-Questions Game"과 유사하게 일련의 테스트를 거쳐 데이터를 분류한다. (마치 스무고개처럼)

### Structure

- **Node**: Feature test를 수행, Input space에서 **Decision boundaries**를 형성
- **Branch**: 이전 Feature test의 output
- **Leaf**: Input Region $$\mathbb{R}$$이고, 해당 영역에 속한 샘플들의 Class distribution을 담는다

---

## Inference - 추론 과정

새로운 샘플 $$x$$를 분류하는 과정은 다음과 같다:

1. $$x$$의 Attributes를 테스트해서 $$x$$가 속한 영역 $$R$$을 찾는다
2. 해당 영역의 클래스 분포 $$n_R = (n_{c_1, R}, n_{c_2, R}, ..., n_{c_k, R})$$를 얻는다
3. **Classification Probability**: $$x$$가 클래스 $$c$$에 속할 확률은:
   $$
   p(y=c | R) = \frac{n_{c, R}}{\sum_{c_i \in C} n_{c_i, R}}
   $$
4. **Prediction**: 가장 흔한 라벨 (**Majority label**)을 선택한다:
   $$
   \hat{y} = \arg\max_c p(y=c|R)
   $$

---

## Training Model - Building the Tree

### NP-completeness

모든 가능한 트리 중 최적 트리를 찾는 것은 NP-complete 문제로 intractable하다.

### Greedy Heuristic

그 대신, top-down 방식으로 노드마다 greedy하게 최적의 Split을 선택한다.

### Splitting Criterion

특정 노드 $$t$$에서 Impurity $$i(t)$$를 가장 **많이** 개선하는 분할 $$s$$를 선택한다. 개선 정도 $$\delta i$$의 식은:

$$
\delta i(s,t) = i(t) - p_L \cdot i(t_L) - p_R \cdot i(t_R)
$$

여기서 $$t_L, t_R$$은 좌우의 자식 노드, $$p_L, p_R$$은 각 노드로 가는 샘플의 비율이다.

### Impurity Measures ⭐ **중요**

$$\pi_c = p(y=c|t)$$일 때의 주요 지표는 다음과 같다:

- **Misclassification rate**: 
  $$i_E(t) = 1 - \max_c \pi_c$$
  - 단점: 클래스 확률 변화에 둔감하고, 완벽한 분류를 위해 필요한 2단계 테스트를 단일 단계에서 평가하지 못할 수 있음

- **Entropy**: 
  $$i_H(t) = -\sum_{c_i \in C} \pi_{c_i} \log_2 \pi_{c_i}$$
  - Information Theory에서 볼 때, 값을 인코딩할 때 필요한 평균 비트 수

- **Gini index**: 
  $$i_G(t) = \sum_{c_i \in C} \pi_{c_i} (1 - \pi_{c_i}) = 1 - \sum_{c_i \in C} \pi^2_{c_i}$$
  - 임의로 분류했을 때 잘못 분류될 확률을 측정하고, 로그 계산이 없어서 Entropy보다 빠름

---

## Overfitting, Regularization

트리가 훈련 데이터를 완벽하게 모델링하려고 하면 Overfitting이 발생해서 Generalization 능력이 떨어진다.

### Stopping Criteria (Pre-pruning)

다음 경우 학습을 중단한다:

- 노드가 Pure할 때 ($$i(t) = 0$$)
- Reached Maximum depth
- 노드 내 샘플 수가 threshold $$t_n$$ 미만일 때
- 개선 정도 $$\delta i$$가 threshold $$t_\delta$$ 미만일 때

### Reduced Error Pruning (Post-pruning)

트리를 최대로 키운 후, validation set에서 에러를 가장 많이 줄이는 방향으로 하위 노드를 삭제하는 방법.

---

## k-NN과 비교 분석

### Feature Scaling

k-NN은 거리를 기반으로 해서 스케일에 민감하지만, Decision Tree는 단일 특징의 threshold를 기준으로 분할하므로 feature scale에 영향 없음.

### Complexity

k-NN보다 Memory, Inference 속도에서 훨씬 효율적임.

### Regression

Class label 대신 **Mean**을 사용하고, 분할 시 **Mean-squared-error**를 최소화하는 방향으로 학습한다.

---

## Ensembles

여러 classifier를 결합해서 성능을 높이고, variance를 줄인다.

- **Bagging (Bootstrap Aggregating)**: 중복을 허용한 샘플링으로 여러 트리를 학습시킨 후 다수결 투표를 한다
- **Random Forests**: Bagging에 더해 각 분할 시 피쳐의 무작위 subset만 사용한다. (특징: 분류할 때 보통 $$\sqrt{d}$$개)
- **Boosting**: 이전 모델의 실수를 교정하도록 순차 학습한다. (AdaBoost, XGBoost)

---

## 결론

Decision Tree는 스무고개와 비슷함. 데이터 분류할 때 "이 특징이 특정 값보다 큰가?"라는 질문을 순차적으로 던진다. 너무 세세한 질문을 다 하면 Overfitting, 그 데이터에만 특화되어 새로운 데이터가 왔을 때 적절하지 않음. 그래서 적당한 선에서 질문을 멈추거나(**Pruning**), 여러 의견을 모으는(**Random Forest**) 전략을 사용함. 
