export default function PDFTools(){
    const PDFTools=[
        {
            title:"PDF Merger",
            description:"Merge multiple PDF files into a single document."
        },
        {
            title:"PDF Splitter",
            description:"Split a PDF file into multiple smaller files based on page ranges."
        },
        {
            title:"PDF Compressor",
            description:"Reduce the file size of a PDF document while maintaining quality."
        },
        {
            title:"PDF Converter",
            description:"Convert PDF files to other formats such as Word, Excel, or images."
        },
        {   title:"PDF Editor",
            description:"Edit the content of PDF files, including text, images, and annotations."
        },
        {
            title:"PDF to Word Converter",
            description:"Convert PDF files to editable Word documents while preserving formatting."
        }
    ]
    return(
        <div className="p-8 flex flex-col items-center justify-center gap-[30px] w-full">
            <div>

            </div>
            <div className="flex flex-row items-start justify-start flex-wrap gap-[20px] ">
                {PDFTools.map((tool,index)=>(
                    <PDFToolCard key={index} title={tool.title} description={tool.description}/>
                ))}
            </div>

        </div>
    )
}



function PDFToolCard({title,description}:{title:string,description:string}){
    return(
        <div className="bg-neutral-800 p-4 rounded-md max-w-72 cursor-pointer hover:bg-neutral-700 transition-colors duration-150">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-white/70">{description}</p>
        </div>
    )
}