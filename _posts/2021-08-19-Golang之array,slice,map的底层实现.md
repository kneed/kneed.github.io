---
layout:     post
title:      "Golang之array,slice,map的底层实现"
subtitle:   "Slice, Map"
date:       2021-10-06 11:38:00
author:     "Keal"
header-img: "img/post-bg-go-4.png"
catalog: true
tags:
    - tech
    - go
---

## Array

Array即常说的数组数据类型. Golang中的数组类型由两个部分组成,即元素类型和数组长度.例如

`[10]int 10个int元素类型的数组`

`[10]string 10个string元素类型的数组 `

即使元素类型相同, 但是数组长度不同,在Golang中也被视为是类型不一样.

### 声明数组

```go
arr1 := [3]int{1, 2, 3}  
arr2 := [...]int{1, 2, 3}
```

两种方式的区别只在于是否显示声明了数组长度, 如果使用..., 编译期间会推导出数组大小,两种方式的实际效果是一样的.

### 底层实现

与大部分语言相似,Golang的数组在底层也是一段连续的内存.每个元素都可以通过一个下标索引来访问.

但是Golang数组的一个特殊性在于Golang里的数组是一个值而不是一个指向第一个元素的指针.传递数组的时候,是传递了整个数组的一个值的拷贝.而不是一个指针.这一点需要注意.

### Slice(切片)

Slice是一种动态的数组,与数组相比,增加了三个属性: prt(指向数组的指针), len(切片的长度), cap(切片的容量)

![image-20211007094234486](https://tva1.sinaimg.cn/large/008i3skNgy1gv6i3pilr2j60vg0cumxn02.jpg)

#### 声明切片的几种方式

`s := make([]byte, 5)`

`s := []byte{...}`

`s = s[2:4]`

`var s []byte` 

#### Slice的自动扩容



