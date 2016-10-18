---
layout: page
title:  "Hurricane Sandy Dataset"
date:   2016-10-17 12:05:14 -0400
permalink: /revised-sandy-dataset

---

Users with a tweet in Zone A: _~22K_

```python
_before   = datetime.datetime(2012,10,29,8,0,0,tzinfo=pytz.UTC) #October 29, 12 Noon
_landfall = datetime.datetime(2012,10,30,0,0,0,tzinfo=pytz.UTC) #October 29, 8pm EST (Landflal)
_after    = datetime.datetime(2012,10,31,0,0,0,tzinfo=pytz.UTC) #October 31, 8pm EST
```

Users with tweets in Zone A during landfall (per the above dates): ~900

### Filtering Level 2: _Speed_
Find the _speed_ between any two tweets. This will help invalidate users who move at rates of more than _240m/s_ (Jurak et al.)

### Current Steps
Invalidate users for moving too fast between points and ground truth their data as ZoneA or not by looking at them.
