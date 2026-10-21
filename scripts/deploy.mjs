import {execFileSync} from 'node:child_process';
import {mkdtempSync,readdirSync,readFileSync,rmSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {tmpdir} from 'node:os';
const root=resolve(import.meta.dirname,'..');
function git(args,options={}){return execFileSync('git',['-C',root,...args],{encoding:'utf8',...options}).trim();}
execFileSync('npm',['run','build'],{cwd:root,stdio:'inherit'});
const scratch=mkdtempSync(join(tmpdir(),'liyuan-deploy-'));
try{
 const env={...process.env,GIT_INDEX_FILE:join(scratch,'index')};
 git(['read-tree','--empty'],{env});
 function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const p=join(dir,item.name);if(item.isDirectory())walk(p);else{const blob=git(['hash-object','-w','--stdin'],{input:readFileSync(p)});git(['update-index','--add','--cacheinfo','100644',blob,relative(join(root,'dist'),p).split('\\').join('/')],{env});}}}
 walk(join(root,'dist'));
 const empty=git(['hash-object','-w','--stdin'],{input:''});git(['update-index','--add','--cacheinfo','100644',empty,'.nojekyll'],{env});
 const tree=git(['write-tree'],{env});
 const exists=git(['ls-remote','origin','refs/heads/gh-pages']);let parent=[];
 if(exists){git(['fetch','origin','gh-pages']);parent=['-p',git(['rev-parse','FETCH_HEAD'])];}
 const commit=git(['-c','user.name=Codex','-c','user.email=codex@users.noreply.github.com','commit-tree',tree,...parent,'-m','Publish tested Liyuan game build']);
 execFileSync('git',['-C',root,'push','origin',`${commit}:refs/heads/gh-pages`],{stdio:'inherit'});
 console.log('Uploaded gh-pages build:',commit);
 console.log('Configured site URL: https://junyuzheng62-wq.github.io/liyuan/');
 console.log('Upload does not verify GitHub Pages activation or public availability.');
}finally{rmSync(scratch,{recursive:true,force:true});}
