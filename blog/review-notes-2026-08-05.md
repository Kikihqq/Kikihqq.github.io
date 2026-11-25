# 两篇技术博客的核查与编辑记录

文章日期及版本截止：2026-08-05。此文件不在 posts 目录内，不生成公开博客卡片。

## 原稿内容的保留与纠正

| 原稿主题 | 处理 |
| --- | --- |
| GAN / VAE、Runway、Pika 的历史背景 | 保留背景与条件生成任务区分；删去无固定版本、基准和日期的优劣排序。 |
| 扩散正反过程 | 区分训练加噪与生成去噪，修正“去噪一步生成下一帧”。 |
| Imagen T5-XXL 与级联超分 | 恢复具体 64→256→1024 流程，标明是 2022 文生图架构。 |
| VideoPoet | 恢复 MAGVIT-v2 / SoundStream 编解码与多任务主线，不将文本表示一律说成视觉离散码。 |
| Sora patches、重标注和扩写 | 修正为先压缩再分块；借鉴 DALL·E 3 的重标注方法，不写成 DALL·E 3 直接标注视频。 |
| Transformer 与扩散 | 明确架构、目标、表示是三个维度；Genie 2 作为自回归与扩散组合的实例。 |
| Scaling、显存与长视频 | 保留成本讨论，删除 CNN 必然触顶、算力增长即可解决一致性的绝对推断。 |
| 心智模型、latent MDP、动态与模拟 | 恢复概念解释，加入部分可观测性与马尔可夫近似的条件。 |
| JEPA | 区分遮挡预测与未来预测、无动作预训练与动作后训练，说明 EMA、停止梯度、冻结编码器和部署反馈。 |
| 3D、Marble、SIMA、Waymo | 恢复具体案例及原始发布来源，区分空间资产、环境生成器、行动智能体与驾驶系统。 |
| 反事实、应用、风险 | 保留主要观点，避免将条件预测等同于完整因果识别，避免把愿景写成已验证事实。 |
| Sora 停服 | 根据官方说明区分网页/App；记录 2026-04-26，而非原稿的 3 月日期；不写截至文章日尚未发生的 API 停服。 |

## 新版范围

纳入：Imagen 4、Sora Turbo/2、Runway Gen-4.5、Veo 3.1（注明不是 VideoPoet 续作）、Genie 2/3、V-JEPA/2/2.1、Dreamer 4、SIMA 2、Marble 与 World API。

未纳入晚于文章日期的进展，例如 2026 年 9 月的 World Labs Atlas 与 10 月的 Genie 4。动态官网的导航或推荐栏可能显示后续产品，文章比较依据是有明确日期的正文/论文版本，而非导航标题。

## 图示依据

- Imagen：<https://imagen.research.google/>
- VideoPoet：<https://sites.research.google/videopoet/>
- Sora 初代：<https://openai.com/index/video-generation-models-as-world-simulators/>
- Genie 2：<https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/>
- V-JEPA 2 / 2-AC：<https://arxiv.org/html/2506.09985v1>

以上 SVG 为结构简化示意，省略未公开或非解释所必需的网络细节。正文分别提供来源与适用版本。既有交互图只演示概念与手工物理规则，不标注为模型实验结果。

## 构建

修改 `blog/posts/2026-08-05-*/index.md` 后运行 `python3 blog/build_blog.py`。文章正文、设置、配图与生成页面已归入各自目录；旧文章网址保留兼容跳转。日期、两文互链、首页和博客目录已统一。原始 Downloads 文件不改动，不部署、不推送 GitHub。
