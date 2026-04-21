# Draft — Will Claude Code replace Clay?

**Status:** Unpublished draft from Patrick (voice-authentic). Ready for light edit + post.

---

Time to address the elephant in the room- will Claude Code replace Clay?

To answer this question, let's first break down what both tools do well.

Clay has a few core moats- they have a great marketplace of data providers that is hard to compete with, they have incredible platform engineering for running 100k+ rows of API calls simultaneously, and they have a robust and compliant interface to build GTM workflows.

Claude Code also has some huge strengths- they have the most powerful AI models in the world, the ability to create and run workflows really cheaply, and you can easily connect your tools and data providers without much work. You can even connect it to a tool like Supabase and Google Sheets to mimic the interface of something like Clay.

So, what's the answer? Well, there's even more nuance here:

Firstly, there's the safety and compliance question. Can enterprise companies really connect their Salesforce to a Claude-built workflow and trust it? Personally, I don't think so. Clay's not relying on AI to run the whole workflow. It has agents and AI functions in the tool, but it still offers a reliable option to create and update CRM records via direct, safe integrations. The same can be said for systems like Snowflake, Outreach, and more.

Secondly, there's the data question. Can Clay's data be replaced? Well, in some cases, yes, and in other cases, no. There are plenty of cheap and reliable data providers for things like CPJ, emails, phone numbers, etc, but there are other providers that you can't just buy off the shelf (ex: HG Insights or Claygent models). So, this is a bit of a toss up.

Thirdly, there's the engineering. Right now, you can run basic enrichment workflows for thousands of records easily in Claude. Where this becomes a problem is when building complex workflows with conditional runs, integrations to more complex tools like CRMs, and functions inside of functions that get really hard to keep track of. So, this is pretty use case based.

My conclusion? As of right now, it's not a great replacement for enterprise companies, for pretty much anything. Too many compliance problems, tracking problems, and variability. For startups, it could be a good option depending on the complexity of the workflow. For something like a robust CRM enrichment or a complex inbound lead workflow, I'd still lean towards Clay. For a quick enrichment of a list, or if you're running an insane amount of actions in one table, Claude and a few good APIs can do the job (ask Taylor Haren).

As for the future? I'd be shocked if Clay didn't release something to make it Claude-friendly, and I'd be shocked if Claude didn't release data enrichments within the platform and charge tokens for each API call. Will be interesting to see what happens, but this is my current take! Interested to hear other people's thoughts
