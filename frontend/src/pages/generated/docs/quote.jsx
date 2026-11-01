// Native React page. Data contract: docs/quote.
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
              <th>{"Item"}</th>
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
              <td>{"Subtotal"}</td>
              <td className={"num"}>{data.v9}</td>
            </tr>
            {data.choice10 === 0 ? (
              <>
                <tr>
                  <td>
                    {"Discount ("}
                    {data.v11}
                    {"%)"}
                  </td>
                  <td className={"num"}>
                    {"-"}
                    {data.v12}
                  </td>
                </tr>
              </>
            ) : null}
            <tr>
              <td>{"GST"}</td>
              <td className={"num"}>{data.v13}</td>
            </tr>
            <tr className={"t"}>
              <td className={"t"}>{"Total payable"}</td>
              <td className={"num t"}>{data.v14}</td>
            </tr>
          </tbody>
        </table>
        {"\n  "}
        {data.choice15 === 0 ? (
          <>
            <p>
              <b>
                {"Expected government subsidy: "}
                {data.v16}
                {"."}
              </b>
              {
                " Paid by the government to the customer's bank account after commissioning; it is not deducted from this quotation. Net cost after subsidy: about "
              }
              {data.v17}
              {"."}
            </p>
          </>
        ) : null}
        {"\n  "}
        <p>
          {"Version "}
          {data.v18}
          {data.choice19 === 0 ? (
            <>
              {" · valid until "}
              {data.v20}
            </>
          ) : null}
          {". Advance of "}
          {data.v21}
          {" confirms the order"}
          {data.choice22 === 0 ? <>{" (30% of the total)"}</> : null}
          {"."}
        </p>
        {"\n  "}
        {data.choice23 === 0 ? (
          <>
            <p>
              {"Accepted by "}
              <b>{data.v24}</b>
              {" on "}
              {data.v25}
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
