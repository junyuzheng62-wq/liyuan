export async function enterExploration(page){
 await page.getByRole('button',{name:'开始游戏'}).click({timeout:45000});
 await page.getByRole('button',{name:'跳过开场'}).click();
 await page.getByRole('button',{name:'开始探索'}).click();
 await page.locator('.look-zone').waitFor();
 await page.locator('.veil').waitFor({state:'hidden',timeout:45000});
}
