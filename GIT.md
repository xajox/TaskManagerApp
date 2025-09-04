### Pojmy

- repozitár: projekt verzovaný Gitom.
- commit: uložená verzia zmenených súborov.
- branch/vetva: paralelná línia vývoja (napr. main, feature/tasks).
- remote: vzdialený repozitár (zvyčajne origin = GitHub URL).
- main vs master: názov hlavnej vetvy (novšie main, staršie master).

**Základný solo workflow (najčastejšie)**

```
git status                         # čo je zmenené
git add .                          # priprav (staging) všetky zmeny
git commit -m "Popis zmeny"        # ulož verziu (snapshot)
git push                           # odošli na GitHub (origin current branch)
```

**Prepojenie s GitHubom (raz na projekt)**

```
git remote add origin https://github.com/<meno>/<repo>.git
git branch -M main                 # premenuj lokálnu vetvu na main
git push -u origin main            # prvý push + nastav tracking
```

```
git remote -v                      # pozri URL
git remote set-url origin <nova-url>
```

**Stiahnutie zmien (pull)**

```
git pull origin main               # stiahni a zmerguj z GitHubu do lokálnej vetvy
```

Použi, keď:

- niekto iný pushol zmeny,
- alebo má GitHub novšie commity ako ty.

**Branching (vetvenie)**

```
git checkout -b feature/tasks      # vytvor a prejdi na novú vetvu
# ... kóduj, commituj ...
git push origin feature/tasks      # pošli vetvu na GitHub
```

**Zoznam a prepínanie:**

```
git branch                         # zoznam lokálnych vetiev
git checkout main                  # prepni späť na main
```

**Po dokončení a merge:**

```
git branch -d feature/tasks        # vymaž lokálnu vetvu (po merge)
```

**Pull Request (PR) – kompletný recept**

1. Uisti sa, že main je aktuálny:

```
git checkout main
git pull origin main
```

2. Vytvor vetvu na funkciu:

```
git checkout -b feature/tasks-title
```

3. Urob zmeny + commit:

```
git add .
git commit -m "Update Tasks title"
```

4. Pushni vetvu:

```
git push origin feature/tasks-title
```

5. Na GitHube klikni Compare & pull request → vyber base: main ← compare: feature/tasks-title → Create PR.

6. Po schválení Merge PR do main.

7. (voliteľné) Zmaž vetvu lokálne aj na GitHube.

**Riešenie konfliktov (základ)**

1. Otvor súbor(y) s konfliktom (uvidíš <<<<<<<, =======, >>>>>>>).

2. Ručne nechaj správnu verziu, vymaž značky.

3. Potvrď:

```
git add .
git commit -m "Resolve merge conflict"
```

**Kontrola histórie a rozdielov**

```
git log --oneline --graph --decorate --all   # prehľadná história
git diff                                      # rozdiely v pracovnom adresári
git diff --staged                             # rozdiely v stagingu (po add)
```

**Návrat späť / opravy**

```
git restore <súbor>                   # vráť súbor z posledného commitu
git restore --staged <súbor>          # zruš 'git add' (vyber zo stagingu)
git checkout <commit> -- <súbor>      # vytiahni verziu súboru z daného commitu
```

**Reset**

```
git reset --soft HEAD~1               # zruš posledný commit, nechaj zmeny v stagingu
git reset --mixed HEAD~1              # zruš commit, zmeny v pracovnom adresári
git reset --hard HEAD~1               # zahoď commit aj zmeny (nevratné)
```
