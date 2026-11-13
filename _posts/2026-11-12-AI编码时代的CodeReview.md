---
layout: post
title: AI 编码时代，Code Review 怎么做
date: 2026-11-12 20:30
author: Keal
header-img: img/tag11.jpg
catalog: true
mermaid: true
tags:
  - tech
  - AI
---

<!-- 【我的观点】导语 -->
<p class="lead">AI 写代码越来越快，质量也越来越高，但 Code Review 还在按「人写、人一行行看」的方式运行。这套方式已经跟不上了，而且越来越不划算。更根本的是，编码从来不是目的，只是实现功能的手段。既然写代码的主力换成了 AI，代码的组织方式、review 的方式，都应该跟着换。</p>

这篇文章分两部分。第一部分说为什么要改，是我自己的判断；第二部分说怎么改，参考了 Anthropic 的 Claude Code 团队、Cursor，以及社区里几篇比较有代表性的实践。

## 为什么要改

<!-- 【我的观点】第一点 -->
### 一、人逐行看，跟不上，也不划算

AI 编码的速度越来越快，质量也越来越高。如果还靠人逐行 review，效率完全跟不上，性价比也很低。人的精力和注意力是有限的，应该放在更重要的地方。

<!-- 【拓展】以下数据来自 Anthropic 和 Cursor 的公开文章 -->
几组公开数据能说明这个速度：

- Claude Code 自己的代码，大约 90% 是 Claude 写的。Anthropic 主仓库每天合入的改动，从 2026 年 5 月的约 2,500 个涨到 9 月的 3 万多个。
- Cursor 内部合并的 PR 里，35% 是云端 agent 自主创建的。他们统计到，每个 PR 新增行数的 P75 一年涨了约 2.5 倍，超过 1000 行的大 PR 占比也在上升。
- 而经典的代码审查经验是：一次审几百行以内，质量才能保持住。

数量是一方面，另一方面是逐行看本身就不太有效。AI 写的代码格式整齐、命名规范，看上去往往比人写的还像样。Cursor 的文档里反复提醒一句话：AI 生成的代码可能看起来是对的，但其实有细微的错误。逐行 review 最擅长发现的拼写、风格、低级错误，恰恰是 AI 最少犯的；它会犯的错——没理解需求、漏了边界情况、改了不该改的地方——光读 diff 很难读出来。

所以问题不只是「人看不过来」，而是「人把时间花在了效果最差的地方」。

<!-- 【我的观点】第二点 -->
### 二、代码是手段，不是目的

编码不是目的，是实现功能的手段。人写也好，AI 写也好，最终都是为了实现某些功能。所以代码现在不一定要按方便人的方式来组织，而应该以更方便 AI 处理的形式来组织。

<!-- 【拓展】第二点的推论 -->
这个判断会带出两个推论。

**第一，review 的对象要从「代码」移到「行为」。** 既然最终要的是功能，那 review 要回答的核心问题就是：这个改动做到了它该做的事吗？有没有破坏别的东西？这需要的是证据——测试结果、运行截图、录屏——而不只是一份 diff。Cursor CEO Michael Truell 在一篇文章里说，人的角色正在从「指导每一行代码」变成「定义问题、设定审查标准」。

**第二，代码库要为 AI 准备好。** 过去我们为人写 README、写注释、定代码规范；现在要为 AI 准备它看不出来的上下文、它能自己跑的检查、它能照着学的样例。代码库对 AI 越友好，AI 交出来的东西越可靠，人需要审的就越少。

<div class="callout callout-note" markdown="1">

<!-- 【拓展】边界说明 -->
「方便 AI」和「方便人」大部分时候并不冲突。强类型、清晰的模块边界、完善的测试、小而聚焦的改动，对两者都友好。真正需要取舍的地方很少，而且在高风险的代码上（认证、计费、数据迁移），人仍然需要能看懂。Cursor 社区里有团队就提到，人审的重点已经不是找 bug，而是「这段代码人能不能看懂、符不符合架构」。

</div>

## 怎么改：几家的做法

<!-- 【拓展】以下全部是参考资料的整理，不是我自己的实践 -->
下面主要参考这几份材料：

<div class="card-grid">
<div class="mech-card is-param">
<span class="kicker">Anthropic</span>
<strong>Claude Code 团队</strong>
<p>团队怎么设计从写代码到上线的整条审查流程，以及 Claude Code 的官方 Best Practices。</p>
</div>
<div class="mech-card is-reason">
<span class="kicker">Cursor</span>
<strong>Bugbot 与 agent 实践</strong>
<p>Cursor 的 PR 审查 agent、写给开发者的 agent 最佳实践，以及他们内部的做法。</p>
</div>
<div class="mech-card is-tool">
<span class="kicker">社区</span>
<strong>Simon Willison 等</strong>
<p>「你的工作是交付已被证明能用的代码」，以及 AGENTS.md 标准和一线团队的讨论。</p>
</div>
</div>

几家的说法细节不同，但方向高度一致。我把它们归成六条。

### 01 先要证据，再看 diff

Simon Willison 有一篇流传很广的文章，标题就是观点：你的工作是交付已经被证明能用的代码。他要求每个改动都有两样证明：

- **手动验证**：自己亲眼看到代码做对了事，并把命令和输出、或者录屏贴进 PR。如果你没亲眼看到它跑对，那它就不算能用。
- **自动测试**：附带一个测试，而且这个测试在你撤销实现之后应该会失败。

对 AI 来说，这两件事是一回事：让 agent 自己跑命令、自己截图，把证据交出来。

另外两家也是这个思路：

- Claude Code 的 Best Practices 说，没有能判定通过或失败的检查，你自己就成了测试。它建议用 `Stop` hook 在 Claude 想结束时强制跑一次类型检查或测试，不通过就不让它结束；`/verify` 则让 Claude 把应用真正跑起来看。
- Cursor 的云端 agent 交回来的不只是 diff，还有日志、录屏和可预览的页面。有一场分享里的说法很到位：diff 描述的是实现，演示暴露的才是用户会遇到的行为。

### 02 把代码库改造成 AI 能自己验证的样子

这一条对应前面的第二个判断。几家的做法可以归成三件事。

**给 AI 一份它看不出来的上下文。** 现在几家工具都有自己的规则文件：

| 文件 | 用在哪里 | 写什么 |
| --- | --- | --- |
| `CLAUDE.md` | Claude Code | 测试和检查命令、容易误导的老代码、没写在代码里的约定 |
| `AGENTS.md` | Codex、Cursor、Copilot 等多数工具的通用格式 | 同上。大仓库可以每个子包放一份，离被改文件最近的那份生效 |
| `.cursor/rules/` | Cursor | 同上，可以按路径生效 |
| `REVIEW.md` / `.cursor/BUGBOT.md` | AI 审查员 | 这块代码最怕什么样的错误、哪些路径可以跳过、哪些规则必须拦住 |

几家对这些文件的建议出奇一致：**写短**。只写 AI 从代码里看不出来的东西；不要把代码规范抄进去（交给 linter）；不要描述目录结构（AI 自己会读）；规则不要一开始就写满，等 AI 同一个错犯了两次再加。规范样例不要复制进去，指向仓库里的样例文件就行。

**给 AI 能自己跑的检查。** Cursor 的说法是「可验证的目标」：类型检查抓结构错误，测试抓行为回归，lint 抓风格和模式问题。所以强类型语言、配好的 linter、覆盖到位的测试，在 AI 时代价值反而更高了。Simon Willison 还提到一点：测试代码本身要整理好，因为 AI 会照着已有的测试模式写新测试，你的测试长什么样，它写出来的就长什么样。

还有一个容易忽略的地方：**检查要快**。Cursor 算过一笔账：一套要跑 10 分钟的测试，10 个 agent 并行各跑一次，加起来就是将近两个小时的等待；测试提速一半，每轮就能省将近一小时。过去测试慢只是让人等得烦，现在会直接拖慢所有 agent。

**改动要小，历史要清楚。** Cursor 建议用小而语义清晰的提交，每个提交只做一件事。开发时可以随便写，最后让 agent 重整提交历史：从 main 重新开始，按逻辑顺序拆成干净的几个提交，再核对最终 diff 和原来一致。Bugbot 遇到超过大小上限的 PR 会直接跳过，让你拆小再提。

### 03 AI 审查：抓真 bug，别制造噪音

PR 提上来之后，第一个审查者是 AI。两家的做法：

| | Claude Code | Cursor Bugbot |
| --- | --- | --- |
| 提交前在本地审 | `/code-review`、`/security-review` | `/review-bugbot`、Agent Review |
| PR 上自动审 | Code Review for Claude Code | Bugbot，每次推送自动跑 |
| 怎么减少误报 | 多个 agent 找 bug，另一组 agent 投票，认同的才发出来；丢掉纯风格意见 | 读取已有评论避免重复；默认只审上次审查之后的新改动 |
| 自动修复 | agent 有时会在夜里直接推修复 | Autofix 起一个云端 agent 修，在原分支上最多尝试 3 次 |
| 审查强度 | Quick / Standard / Deep | Low / Default / High / Smart |
| 规则文件 | `REVIEW.md` | `.cursor/BUGBOT.md` |

两家都特别在意**噪音**。Claude Code 的文档说，让审查者去找问题，它总能找出点什么；照单全收的话，代码会被改出一堆不必要的抽象。作者也是 agent 的时候更麻烦：人看到无关痛痒的意见可能直接忽略，agent 会老老实实去改，于是多一次提交，触发新一轮审查。

Claude Code 团队就遇到过一个 PR 一晚上被审了 50 多轮。用 git blame 一查，审查员反复指出的问题里约 59% 是第一轮就已存在的老代码。他们后来限制最多 3 轮、之后只审新改动、同类问题一次指全、提过的不重复提，老代码交给每晚单独跑的审查：

| 指标 | 改进前 | 改进后 |
| --- | --- | --- |
| 一轮审查加修复就通过 | 65% | 78% |
| 需要 5 轮以上 | 8.9% | 1.5% |
| 平均审查轮数 | 2.08 | 1.32 |

Cursor 则用一个指标来衡量审查质量：**解决率**，也就是被指出的问题在合并时有没有真的被修掉。这比评论数量有意义得多。作为对比，Cursor 引用的数据是人工 review 的评论只有大约一半会在同一个 PR 里带来改动。Bugbot 的解决率经过 40 轮实验从 52% 提到了 70% 以上，到 2026 年 5 月默认档位约为 80%。

还有一个细节值得学：Bugbot 的配置从 PR 的目标分支读取，而不是从 PR 自己的分支读取。这样一个 PR 就没法通过修改配置来改变自己被审查的方式。

### 04 分清「建议」和「强制」

Claude Code 的 Best Practices 把给 AI 的约束分成两种：

<div class="compare-grid">
<div class="compare-col">
<span class="kicker">建议：AI 自己判断</span>
<p>提示词、规则文件、skills。AI 通常会照做，但没有保证。适合编码风格、团队习惯这类允许例外的事。</p>
</div>
<div class="compare-col">
<span class="kicker">强制：系统执行</span>
<p>hooks、权限里的 deny 规则、CI、分支保护。不管 AI 怎么想都绕不过去。适合「绝不能读密钥文件」「不能改 migrations 目录」这类零例外的规则。</p>
</div>
</div>

两个常见的错误方向：

- **该强制的只写成了建议。** 在规则文件里加「IMPORTANT」甚至全大写，AI 还是会偶尔违反。这时候加重语气没用，要么文件太长了，要么这条规则本来就该做成 hook。
- **把偏好做成了强制。** 文档里说，一个项目要是配了四十个 hooks 和规则，多半是把个人偏好当成了硬规则。

放到 review 流程上也一样：CI 不过不能合，审查意见没处理完不能合，敏感目录没人批准不能合，这些应该是系统层面的硬约束，而不是靠审查者记得去检查。

### 05 按风险决定要不要人、要几个人

这一条直接对应前面说的「把人的精力放在更重要的地方」。

Claude Code 团队按改动的风险分三档：

| 风险 | 典型改动 | 需要的人工批准 |
| --- | --- | --- |
| 低 | 文档、文案、只影响内部、藏在功能开关后的新增功能 | 自动检查和安全审查都通过即可 |
| 中 | 普通产品改动；缓存、自动更新、系统提示词等敏感区域 | 1 人 |
| 高 | 风险最高的代码，以及规定必须两人审的路径 | 2 人 |

配套规则：风险由改动内容决定，不由作者决定；CI 配置和负责人标记的敏感路径永远要人批准；agent 的批准不能顶替人的批准；批准只对某个具体的提交有效。

Cursor 也在做同样的事。他们有一类 Approval Agent，按风险分数自动批准低风险 PR，高于阈值的按区域分给对应负责人。一场分享里提到，Cursor 生态里大约 30% 到 40% 的 PR 已经不经人工审查就合并（这个数字来自第三方对分享内容的转述）。

一线团队普遍更保守一些。在 Cursor 社区的一个讨论里，多数团队仍然要求每个 PR 都有人审，但也有团队给出了很具体的分法：

- **CI 绿了、AI 审查没问题就可以合**：依赖小版本升级、文案和多语言字符串、只加测试、lint 和格式修复。
- **永远要第二个人**：认证和权限、数据库迁移和任何写数据的操作、计费、基础设施和配置，以及 agent 改了任务范围之外文件的情况。

人省下来的精力应该花在哪里，几家的回答也基本一致：这件事该不该做（方向和范围）、高风险的代码、会被别人照着抄的架构设计、读证据，以及最终为结果负责。

### 06 审查员本身也要被审查

AI 审查员不是配好就完事的。

- **把事故变成评测集。** Claude Code 团队收集过去导致事故或回滚的 PR，每天让审查员跑一遍；每次调整提示词、工具或模型都要重新打分，分数涨了才保留。
- **把人的纠正变成规则。** Bugbot 会从已合并的 PR 里自动学习规则，也可以在 PR 里写 `@cursor remember` 手动记一条。Cursor 内部还会把人的纠正变成评测用例。
- **漏了就补上下文。** 审查员漏掉问题时，Claude Code 团队问的是：模型当时缺了什么信息？然后补进规则文件、skill 或一条新检查。

这其实又回到了第二个判断：代码库对 AI 越友好，审查就越可靠。

## 敢少用人的前提

<!-- 【拓展】 -->
少看代码不等于多信 AI。能把人从逐行检查里解放出来，前提是后面的兜底足够强：改动够小，一切都能撤回（功能开关、回滚、灰度发布），出了问题能很快发现，出事不追究个人而是补强流程。

Claude Code 团队也坦白了还没做到的地方：回滚率或事故率变差时，审批规则还不会自动收紧。他们有一句话我很认同：放慢速度确实能降低出错率，但主要是因为什么都做得少了；与其放慢，不如让发现和修复问题变得更快。

## 落地清单

<details class="fold" markdown="1">
<summary>个人：从下一次 AI 编码开始</summary>

- 写一份简短的规则文件（`CLAUDE.md` 或 `AGENTS.md`），只写 AI 从代码里看不出来的东西。
- 复杂任务先让 AI 把需求整理成 SPEC，再照着写。
- 让 AI 交证据：命令和输出、截图、一个撤销实现就会失败的测试。
- 提交前在本地跑一次 AI 审查，要求只报正确性问题。

</details>

<details class="fold" markdown="1">
<summary>项目：让代码库对 AI 友好</summary>

- 规则文件提交进仓库；大仓库按子目录分别放。
- 补齐类型检查、lint 和测试，并让它们跑得快。
- 整理测试代码，让 AI 有好的样例可以照着写。
- 用 hooks 和 deny 规则守住零例外的规则。
- 写一份给审查员看的规则文件（`REVIEW.md` 或 `BUGBOT.md`）。
- PR 模板加上「怎么测的」「有什么风险」「怎么回滚」。

</details>

<details class="fold" markdown="1">
<summary>团队：调整审查流程</summary>

- 先在一个仓库接入 AI 审查，用解决率衡量效果，调几周再推广。
- 审查意见没处理完不能合并；限制审查轮数，之后只审新改动。
- 写清楚风险分级，从严开始，有数据再放宽；敏感路径用 CODEOWNERS 和分支保护锁住。
- agent 的批准不能代替人；有新提交要重新批。
- 把事故整理成评测集，持续给审查员打分。
- 主要看每个改动花掉的人力，同时盯住回滚率和事故率。

</details>

## 最后

<!-- 【我的观点】的延伸，结尾 -->
回到开头的两个判断。

人逐行看代码跟不上、也不划算，所以要把人的精力从「逐行检查」挪到「判断方向、守住高风险、对结果负责」上。代码是手段不是目的，所以 review 要从看代码转向看行为、看证据，代码库也要从只为人组织，转向同时为 AI 组织：给它看不出来的上下文，给它能自己跑的检查。

Code Review 并没有消失，只是从「人读代码」变成了「人设计一套让 AI 的产出能被验证的系统」。

<details class="fold" markdown="1">
<summary>参考资料</summary>

- Anthropic：[How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/)（2026-10-15）
- Claude Code 文档：[Best practices](https://code.claude.com/docs/en/best-practices)
- Cursor：[Best practices for coding with agents](https://cursor.com/blog/agent-best-practices)（2026-01-09）
- Cursor：[AI code review: more context, fewer bugs](https://cursor.com/guides/ai-code-review)（2026-08-12）
- Cursor：[Reviewing and Testing Code](https://cursor.com/learn/reviewing-testing)
- Cursor：[Bugbot 文档](https://cursor.com/docs/bugbot)
- Cursor：[The third era of AI software development](https://cursor.com/blog/third-era)（2026-02-26）
- Arize：[Inside Cursor's agent factory](https://arize.com/blog/inside-cursors-agent-factory-how-it-verifies-ai-written-code/)（2026-07，第三方转述）
- Simon Willison：[Your job is to deliver code you have proven to work](https://simonwillison.net/2025/Dec/18/code-proven-to-work/)（2025-12-18）
- [AGENTS.md](https://agents.md/)
- Cursor 社区：[Has your team changed its human code-review requirements…](https://forum.cursor.com/t/has-your-team-changed-its-human-code-review-requirements-since-adopting-ai-coding-agents/175029)

</details>
