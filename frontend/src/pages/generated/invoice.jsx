// Native React page. Data contract: docs/invoice.
import { Fragment, cssStyle, Partial } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"toolbar-print"}>
        <button className={"btn btn-dark"} onClick={() => window.print()}>
          {"Print / save as PDF"}
        </button>
      </div>
      {"\n"}
      <div className={"doc"}>
        {"\n  "}
        <Partial part={data.part1} state={state} />
        {"\n  "}
        <table>
          <thead>
            <tr>
              <th>{"#"}</th>
              <th>{"Description"}</th>
              <th className={"num"}>{"Qty"}</th>
              <th className={"num"}>{"Rate"}</th>
              <th className={"num"}>{"GST"}</th>
              <th className={"num"}>{"Amount"}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows2?.length ? (
              data.rows2.map((row2, index) => (
                <Fragment key={index}>
                  <tr>
                    <td>{row2.v3}</td>
                    <td>{row2.v4}</td>
                    <td className={"num"}>{row2.v5}</td>
                    <td className={"num"}>{row2.v6}</td>
                    <td className={"num"}>
                      {row2.v7}
                      {"%"}
                    </td>
                    <td className={"num"}>{row2.v8}</td>
                  </tr>
                </Fragment>
              ))
            ) : (
              <></>
            )}
          </tbody>
        </table>
        {"\n  "}
        <table
          className={"totals"}
          style={cssStyle("width:46%;margin-left:auto")}
        >
          <tbody>
            <tr>
              <td>{"Taxable value"}</td>
              <td className={"num"}>{data.v9}</td>
            </tr>
            <tr>
              <td>{"GST"}</td>
              <td className={"num"}>{data.v10}</td>
            </tr>
            <tr className={"t"}>
              <td className={"t"}>{"Invoice total"}</td>
              <td className={"num t"}>{data.v11}</td>
            </tr>
            {data.rows12?.length ? (
              data.rows12.map((row12, index) => (
                <Fragment key={index}>
                  <tr>
                    <td>
                      {"Received "}
                      {row12.v13}
                      {" ("}
                      {row12.v14}
                      {")"}
                    </td>
                    <td className={"num"}>
                      {"-"}
                      {row12.v15}
                    </td>
                  </tr>
                </Fragment>
              ))
            ) : (
              <></>
            )}
            <tr className={"t"}>
              <td className={"t"}>{"Balance due"}</td>
              <td className={"num t"}>{data.v16}</td>
            </tr>
          </tbody>
        </table>
        {"\n  "}
        <p style={cssStyle("font-size:12px")}>
          {data.choice17 === 0 ? (
            <>
              {"Due by "}
              {data.v18}
              {". "}
            </>
          ) : null}
          {"Pay by UPI "}
          <b>{data.v19}</b>
          {" or bank transfer: "}
          {data.v20}
          {"."}
        </p>
        {"\n  "}
        {data.choice21 === 0 ? (
          <>
            <p style={cssStyle("font-size:12px")}>
              {"Raised for service request "}
              {data.v22}
              {"."}
            </p>
          </>
        ) : null}
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
