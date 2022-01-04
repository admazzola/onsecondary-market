 
import FileHelper from '../lib/file-helper.js'

 import AppHelper from '../lib/app-helper.js'

let outputConfig;  // = FileHelper.readJSONFile('./market-api-server/config/baycOutputData.json')
 
export default class PopulateCachedNFTTilesTask {


static async runTask(inputs, mongoInterface ){

    
 let collectionName = inputs.collectionName 

 
 outputConfig = FileHelper.readJSONFile(`./market-api-server/config/${collectionName.toLowerCase()}.json`)
  

 let tokenDataArray = []
    

  for(let [tokenId,traitsArray] of Object.entries(outputConfig)){
    

      let contractAddress = AppHelper.contractCollectionNameToContractAddress(collectionName)
      contractAddress = AppHelper.toChecksumAddress(contractAddress)

      tokenDataArray.push({
            collectionName:  collectionName,
            contractAddress: contractAddress,
            tokenId: parseInt(tokenId),
            nftTraits:traitsArray,
            combinedAssetId: AppHelper.getCombinedAssetId(contractAddress,parseInt(tokenId))
      })

  }   
 
  
  const nftTilesModel =  mongoInterface.cachedNFTTileModel
  

  try{
   let inserted = await nftTilesModel.insertMany(tokenDataArray,{ ordered: false })
  }catch(e){
    console.log('WARN: Could not insert nft tiles.  (They already exist?)')
  }


  let tilesMissingContractAddress = await nftTilesModel.find({contractAddress: {$exists:false}})
  for(let tile of tilesMissingContractAddress){

    let contractAddress = AppHelper.contractCollectionNameToContractAddress(tile.collectionName)
    contractAddress = AppHelper.toChecksumAddress(contractAddress)

    await nftTilesModel.updateOne({_id:tile._id}  , {contractAddress:contractAddress} )

  }

  let tilesMissingCombinedAssetId = await nftTilesModel.find({combinedAssetId: {$exists:false}})
  for(let tile of tilesMissingCombinedAssetId){

    let combinedAssetId = AppHelper.getCombinedAssetId(tile.contractAddress,tile.tokenId)

    await nftTilesModel.updateOne({_id:tile._id}  , {combinedAssetId:combinedAssetId} )

  }
 
    
  console.log(`PopulateCachedNFTTilesTask ${collectionName}: task complete.`)
    

}


} 


 