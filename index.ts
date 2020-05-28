import { forkJoin, Observable, combineLatest, of } from 'rxjs'; 
import { map, switchMap, mergeMap, flatMap } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';
import { fromPromise } from 'rxjs/internal-compatibility';

interface GitHubContent {
  name: string;
  url: string;
  download_url: string;
  type: string;
}

interface BlogNoteInfo {
  title: string;
  topic: string;
  description: string;
  language: string;
  date: Date;
  tags: Array<string>;
  previewImageUrl: string;
  headerImageUrl: string;
}

class BlogNote {
    constructor(public info: BlogNoteInfo,
                public contentUrl: string){}
}

(() => {
  getBlogNotes().pipe(
    map(x => x.map(c => getBlogNoteContent(c.url).pipe(switchMap(b => mapToBlogNote(b))))),
    switchMap(x => forkJoin(x)),
  ).subscribe(x => document.body.innerText = JSON.stringify(x));
})();

function getBlogNotes(): Observable<Array<GitHubContent>> {
  return httpGet<Array<GitHubContent>>("https://api.github.com/repos/santoro-mariano/blog/contents");
}

function getBlogNoteContent(blogNoteUrl: string): Observable<Array<GitHubContent>> {
  return httpGet<Array<GitHubContent>>(blogNoteUrl)
            .pipe(map(x => x.filter(c => c.type === "file")));
}

function mapToBlogNote(contents: Array<GitHubContent>): Observable<BlogNote> {
  const infoFile = contents.find(c => c.name === "info.json");
  const indexFile = contents.find(c => c.name === "index.md");
  return forkJoin([httpGet<BlogNoteInfo>(infoFile.download_url), of(indexFile.download_url)]).pipe(
    map(values => new BlogNote(values[0], values[1]))
  )
}

function httpGet<T>(url: string): Observable<T> {
  return fromFetch(url).pipe(switchMap(x => x.json()));
}